/**
 * Pre-call intel: the "walk in and drop a nugget" engine.
 *
 * Before an ambassador knocks, the CRM diagnoses the business three ways:
 *  1. PROBE — ask the model what it actually knows about THIS business by
 *     name. Nothing/wrong/vague = the door-opener ("ChatGPT tells people
 *     you close at 5 — you close at 8").
 *  2. CATEGORY CHECK — who the model recommends when asked for their kind of
 *     business (cached per category, refreshed weekly). Competitors that come
 *     up when they don't = competitive anxiety with a real source.
 *  3. SYNTHESIS — all real data (probe, category check, listing gaps, a paid
 *     competitor's listing) → one natural opener, one insight, the likely
 *     objection and its counter. Cached per business for 7 days.
 *
 * Everything shown to an owner is a real model response, dated — never an
 * invented score.
 */
import { and, eq, ne, sql } from "drizzle-orm";
import { aiCategoryCheck, aiStopIntel, business, StopIntel } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { Db, requireDb } from "./crmDb";

const MODEL = "gpt-4o-mini";
const CATEGORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INTEL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function text(res: Awaited<ReturnType<typeof invokeLLM>>): string {
  return ((res.choices[0]?.message?.content as string) ?? "").trim();
}

/** Who does the model recommend for this category? Cached weekly. */
async function getCategoryCheck(db: Db, categoryName: string) {
  const rows = await db.select().from(aiCategoryCheck).where(eq(aiCategoryCheck.categoryName, categoryName)).limit(1);
  const cached = rows[0];
  if (cached && Date.now() - cached.checkedAt.getTime() < CATEGORY_TTL_MS) return cached;

  const res = await invokeLLM({
    model: MODEL,
    messages: [
      {
        role: "user",
        content:
          `A local resident asks you: "What are the best ${categoryName.toLowerCase()} in the Temecula, California area? ` +
          `Give me your top recommendations." Answer as you normally would, naming specific businesses.`,
      },
    ],
  });
  const raw = text(res);

  // Second cheap pass: extract just the business names.
  const extract = await invokeLLM({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: `List ONLY the business names mentioned in this text as a JSON array of strings, nothing else:\n\n${raw}`,
      },
    ],
    response_format: { type: "json_object" },
  });
  let names: string[] = [];
  try {
    const parsed = JSON.parse(text(extract)) as unknown;
    const arr = Array.isArray(parsed) ? parsed : Object.values(parsed as Record<string, unknown>).find(Array.isArray);
    names = ((arr as unknown[]) ?? []).filter((n): n is string => typeof n === "string").slice(0, 12);
  } catch {
    names = [];
  }

  const upserted = await db
    .insert(aiCategoryCheck)
    .values({ categoryName, mentionedNames: names, rawResponse: raw, model: MODEL, checkedAt: new Date() })
    .onConflictDoUpdate({
      target: aiCategoryCheck.categoryName,
      set: { mentionedNames: names, rawResponse: raw, model: MODEL, checkedAt: new Date() },
    })
    .returning();
  return upserted[0];
}

function listingGaps(b: typeof business.$inferSelect): string[] {
  const gaps: string[] = [];
  if (b.directoryClaimStatus === "unclaimed") gaps.push("listing unclaimed — nobody owns their presence");
  if (!b.website) gaps.push("no website on the listing");
  if (!b.phone) gaps.push("no phone number on the listing");
  if (!b.hours) gaps.push("no business hours listed");
  return gaps;
}

/** Loose name match: is this business among the mentioned names? */
function nameMatches(businessName: string, mentioned: string[]): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const bn = norm(businessName);
  return mentioned.some((m) => {
    const mn = norm(m);
    return bn.includes(mn) || mn.includes(bn);
  });
}

export async function getStopIntel(businessId: string): Promise<StopIntel & { generatedAt: string }> {
  const db = await requireDb();

  const cachedRows = await db.select().from(aiStopIntel).where(eq(aiStopIntel.businessId, businessId)).limit(1);
  const cached = cachedRows[0];
  if (cached && Date.now() - cached.generatedAt.getTime() < INTEL_TTL_MS) {
    return { ...cached.intel, generatedAt: cached.generatedAt.toISOString() };
  }

  const bRows = await db.select().from(business).where(eq(business.businessId, businessId)).limit(1);
  const b = bRows[0];
  if (!b) throw new Error("business not found");
  const name = b.name ?? "this business";

  // 1. Probe: what does the model actually know about them?
  const probeRes = await invokeLLM({
    model: MODEL,
    messages: [
      {
        role: "user",
        content:
          `What do you know about "${name}"${b.city ? ` in ${b.city}, California` : " in the Temecula, California area"}? ` +
          `Describe the business, its hours, and what it's known for. If you don't have reliable information, say so plainly.`,
      },
    ],
  });
  const probe = text(probeRes);

  // 2. Category check (cached weekly).
  const check = b.categoryName ? await getCategoryCheck(db, b.categoryName) : null;
  const mentioned = check?.mentionedNames ?? [];
  const aiKnowsThem = nameMatches(name, mentioned);
  const competitorsMentioned = mentioned.filter((m) => !nameMatches(name, [m])).slice(0, 4);

  // A nearby paid competitor for the side-by-side, when one exists.
  const paidCompetitor = b.categoryName
    ? (
        await db
          .select({ name: business.name, tier: business.subscriptionTier })
          .from(business)
          .where(
            and(
              eq(business.categoryName, b.categoryName),
              ne(business.businessId, businessId),
              sql`${business.subscriptionTier} is not null and ${business.subscriptionTier} <> 'free'`
            )
          )
          .limit(1)
      )[0] ?? null
    : null;

  const gaps = listingGaps(b);

  // 3. Synthesis: turn the real data into door ammunition.
  const synthesisRes = await invokeLLM({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You write pre-call briefings for field ambassadors of Top of Temecula, a local business directory that AI " +
          "assistants read. The ambassador is about to walk into a business and has 30 seconds to earn attention by " +
          "showing the owner something true and specific about their own AI visibility. Write in plain spoken English — " +
          "no jargon, no hype, nothing that sounds like a sales script. Every claim must come from the data provided; " +
          "invent nothing. Respond as JSON with exactly these keys: opener (1-2 sentences the ambassador can say out " +
          "loud, referencing the most surprising true fact), insight (the single most compelling fact for THIS business, " +
          "one sentence), likelyObjection (the pushback this specific owner will most plausibly give, one sentence, " +
          "first person as the owner), objectionResponse (a respectful, concrete counter, 1-2 sentences), aiSummary " +
          "(one sentence: what AI currently says/knows about them).",
      },
      {
        role: "user",
        content: JSON.stringify({
          business: { name, category: b.categoryName, city: b.city, claimStatus: b.directoryClaimStatus },
          whatAiSaysAboutThemWhenAskedDirectly: probe.slice(0, 1500),
          isRecommendedWhenPeopleAskForTheirCategory: aiKnowsThem,
          competitorsAiRecommendsInstead: competitorsMentioned,
          listingGaps: gaps,
          nearbyPaidCompetitor: paidCompetitor,
        }),
      },
    ],
    response_format: { type: "json_object" },
  });

  let parsed: Partial<StopIntel> = {};
  try {
    parsed = JSON.parse(text(synthesisRes)) as Partial<StopIntel>;
  } catch {
    /* fall through to defaults */
  }

  const intel: StopIntel = {
    opener: parsed.opener ?? `I looked up ${name} on ChatGPT before walking in — can I show you what it says?`,
    insight: parsed.insight ?? (aiKnowsThem ? "AI assistants mention them, but their listing is unclaimed." : "AI assistants don't recommend them for their own category."),
    likelyObjection: parsed.likelyObjection ?? "We already show up fine on Google.",
    objectionResponse:
      parsed.objectionResponse ??
      "Google is where people search — AI assistants are where people now ask. Different index, and right now it's missing you.",
    aiKnowsThem,
    aiSummary: parsed.aiSummary ?? probe.slice(0, 200),
    competitorsMentioned,
    listingGaps: gaps,
  };

  const now = new Date();
  await db
    .insert(aiStopIntel)
    .values({ businessId, intel, probeRaw: probe, model: MODEL, generatedAt: now })
    .onConflictDoUpdate({ target: aiStopIntel.businessId, set: { intel, probeRaw: probe, model: MODEL, generatedAt: now } });

  return { ...intel, generatedAt: now.toISOString() };
}
