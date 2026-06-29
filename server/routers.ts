import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  countRoleplayAttempts,
  createRoleplayAttempt,
  getRoleplayAttempts,
  getTrainingProgress,
  upsertTrainingProgress,
} from "./db";

// ─── Persona system prompts ───────────────────────────────────────────────────

const PERSONA_DESCRIPTIONS: Record<string, string> = {
  busy: "a distracted, time-pressed owner who is half-listening and keeps looking away. You have 3 things going on at once.",
  skeptical_google: "a skeptical owner who already has a Google Business Profile and Yelp listing. You're not convinced you need another platform.",
  friendly_curious: "a warm, open owner who is genuinely curious about the platform. You ask good questions and are winnable.",
  gatekeeper: "a friendly but protective front-desk receptionist or manager. The owner is NOT here. You are warm but guard the owner's email carefully. You want to help but need a good reason to give out contact info.",
  hostile: "a mildly aggressive, irritated owner who had a bad experience with a previous marketing rep. You are NOT interested and will say so directly. If the ambassador keeps pushing after you've said no, you will escalate.",
};

function buildOwnerSystemPrompt(persona: string): string {
  const description = PERSONA_DESCRIPTIONS[persona] || PERSONA_DESCRIPTIONS.friendly_curious;
  return `You are roleplaying as ${description} You are the owner or manager of a small business in the Temecula Valley (e.g. an insurance agency, a salon, a restaurant, a boutique). A summer brand ambassador from "Top of Temecula" just walked in.

Stay fully in character at all times. React realistically: if the ambassador is clear and low-pressure, warm up gradually; if they're pushy, vague, or make dubious claims (like promising Google rankings), get more skeptical and call it out the way a real owner would. Raise the objections this persona would actually raise.

Keep your replies to 1-3 sentences. Never coach, break character, explain yourself, or admit you're an AI.

End the scene naturally once it resolves — the ambassador gets you to claim the listing, you decline clearly, you give them the owner's email (gatekeeper), or you ask them to leave (hostile) — and then output [SCENE COMPLETE] on its own line.`;
}

const EVALUATOR_SYSTEM_PROMPT = `You are a field trainer for Top of Temecula brand ambassadors. You will receive a transcript of a trainee's simulated visit to a local business. Score it against the rubric below and return ONLY valid JSON — no preamble, no markdown, no explanation outside the JSON.

COMPLIANCE AUTO-FAIL if the trainee:
- Claimed the listing improves Google ranking or guarantees customers/leads
- Claimed a partnership with Google, Yelp, the city, or the Chamber of Commerce
- Threatened that the listing would be removed or deleted
- Asked for a credit card for the free claim
- Kept pushing after a clear "no" (more than one follow-up after explicit refusal)
- Ignored a safety cue from a hostile persona instead of disengaging calmly

SCORING RUBRIC (each 0-2):
- led_with_claim: Did they open with "we already created a free listing for you" rather than a generic pitch?
- used_dashboard_hook: Did they mention the AI-citation dashboard or show the listing on their phone?
- objection_handling: Did they handle objections calmly without making false claims?
- secured_outcome: Did they get a claim, capture an email invite (gatekeeper), or disengage safely (hostile)?
- professional_lowpressure: Was the tone professional, warm, and never pushy?
- clean_close: Did they wrap up cleanly — next steps clear, no lingering awkwardness?

PASS LOGIC: result = "PASS" only if compliance_pass === true AND total >= 9 out of 12.

Return this exact JSON schema:
{"compliance_pass":true,"compliance_flags":[],"scores":{"led_with_claim":2,"used_dashboard_hook":2,"objection_handling":2,"secured_outcome":2,"professional_lowpressure":2,"clean_close":2},"total":12,"result":"PASS","what_went_well":["...","..."],"coaching":["...specific + actionable...","..."],"one_thing_to_try_next_time":"..."}`;

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Training Progress
  training: router({
    getProgress: protectedProcedure.query(async ({ ctx }) => {
      const progress = await getTrainingProgress(ctx.user.id);
      return progress ?? {
        completedModules: [] as string[],
        completedQuizzes: [] as string[],
        completedAssignments: [] as string[],
        assignmentsData: {} as Record<string, string>,
        safetyCompleted: false,
        passedFinalTest: false,
        finalTestScore: null as number | null,
        shift1DebriefData: null as Record<string, string> | null,
        supervisorReleased: {} as Record<string, boolean>,
      };
    }),

    saveProgress: protectedProcedure
      .input(z.object({
        completedModules: z.array(z.string()).optional(),
        completedQuizzes: z.array(z.string()).optional(),
        completedAssignments: z.array(z.string()).optional(),
        assignmentsData: z.record(z.string(), z.string()).optional(),
        safetyCompleted: z.boolean().optional(),
        passedFinalTest: z.boolean().optional(),
        finalTestScore: z.number().optional(),
        shift1DebriefData: z.record(z.string(), z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertTrainingProgress(ctx.user.id, input as Parameters<typeof upsertTrainingProgress>[1]);
        return { success: true };
      }),
  }),

  // Roleplay Simulator
  roleplay: router({
    getAttemptCount: protectedProcedure.query(async ({ ctx }) => {
      const count = await countRoleplayAttempts(ctx.user.id);
      return { count };
    }),

    getAttempts: protectedProcedure.query(async ({ ctx }) => {
      return getRoleplayAttempts(ctx.user.id);
    }),

    chat: protectedProcedure
      .input(z.object({
        persona: z.enum(["busy", "skeptical_google", "friendly_curious", "gatekeeper", "hostile"]),
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = buildOwnerSystemPrompt(input.persona);
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...input.messages,
          ],
        });

        const content = (response.choices[0]?.message?.content as string) ?? "";
        const sceneComplete = content.includes("[SCENE COMPLETE]");
        const cleanContent = content.replace("[SCENE COMPLETE]", "").trim();

        return {
          content: cleanContent,
          sceneComplete,
        };
      }),

    evaluate: protectedProcedure
      .input(z.object({
        persona: z.enum(["busy", "skeptical_google", "friendly_curious", "gatekeeper", "hostile"]),
        transcript: z.array(z.object({
          role: z.string(),
          content: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const transcriptText = input.transcript
          .map(m => `${m.role === "user" ? "AMBASSADOR" : "OWNER"}: ${m.content}`)
          .join("\n");

        const response = await invokeLLM({
          messages: [
            { role: "system", content: EVALUATOR_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Persona: ${input.persona}\n\nTranscript:\n${transcriptText}`,
            },
          ],
          response_format: { type: "json_object" },
        });

        const raw = (response.choices[0]?.message?.content as string) ?? "{}";
        let scorecard: Record<string, unknown>;
        try {
          scorecard = JSON.parse(raw);
        } catch {
          scorecard = {
            compliance_pass: false,
            compliance_flags: ["Evaluator parse error — please retry"],
            result: "RETRY",
            total: 0,
            scores: { led_with_claim: 0, used_dashboard_hook: 0, objection_handling: 0, secured_outcome: 0, professional_lowpressure: 0, clean_close: 0 },
            coaching: ["The evaluator had trouble reading the transcript. Please retry."],
            what_went_well: [],
            one_thing_to_try_next_time: "Try again with a cleaner conversation.",
          };
        }

        // Save attempt to database
        await createRoleplayAttempt({
          userId: ctx.user.id,
          persona: input.persona,
          transcript: input.transcript,
          scorecard,
          compliancePass: (scorecard.compliance_pass as boolean) ?? false,
          totalScore: (scorecard.total as number) ?? 0,
          result: (scorecard.result as string) ?? "RETRY",
        });

        return scorecard;
      }),
  }),
});

export type AppRouter = typeof appRouter;
