/**
 * Ambassador Field CRM — tRPC router (Phase 1).
 * Ambassador-facing procedures resolve the ambassador from the session user
 * (issuing a referral code on first use). Admin procedures gate on the shared
 * admin password (matching the existing admin/feedback pattern).
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import {
  addRouteStop,
  hasPriorVisit,
  buildRoutePlan,
  clearRoutePlan,
  createVisit,
  ensureAmbassador,
  getActiveBounty,
  getAnomalyClaims,
  getClaimsByAmbassador,
  getCurriculumGaps,
  getEarnings,
  getLeaderboard,
  getOpenFollowups,
  getPayoutHistory,
  getRoutePlan,
  getTargets,
  getUnpaidBalances,
  getUpgradeBountyConfig,
  getVisitsByAmbassador,
  markRouteStopDone,
  recordPayout,
  recordRoutePing,
  setBounty,
  setRouteStopStatus,
  setUpgradeBounty,
  submitCurriculumGap,
} from "./crmDb";
import { getCredentialByUserId } from "./db";
import { getStopIntel } from "./precallIntel";
import { reconcileLiveCheck } from "./reconciliation";
import { getAttributionLeakCount } from "./monitoring";

// What the ambassador reports: how the conversation ended. "neutral" is
// resolved server-side into first_visit / follow_up from visit history —
// the system never asks a human for a fact the database already knows.
const CONVERSATION_RESULTS = [
  "neutral",
  "claimed_onsite",
  "not_interested_no_revisit",
  "left_info_needs_followup",
  "no_decision_maker",
] as const;

/**
 * All ambassador-facing procedures resolve the ambassador ONCE here (issuing a
 * referral code on first use) and expose it as ctx.ambassador — no procedure
 * can forget to do it or derive the code differently.
 *
 * Field access is EARNED: it requires the training certificate (a credentials
 * row, issued on a perfect final test) and an active ambassador record. This is
 * the server-side gate — routing alone must never be the only thing keeping an
 * uncertified user out of the CRM.
 */
const ambassadorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const cred = await getCredentialByUserId(ctx.user.id);
  if (!cred) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "NOT_CERTIFIED: Complete the training and pass the final certification test to access the Field CRM.",
    });
  }
  const amb = await ensureAmbassador(ctx.user.id, ctx.user.name ?? null);
  if (!amb.active) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "DEACTIVATED: Your ambassador account is deactivated. Contact your coordinator.",
    });
  }
  return next({ ctx: { ...ctx, ambassador: amb } });
});

/**
 * Admin gate as MIDDLEWARE (not a per-procedure call that the next admin route
 * can forget): validates the shared admin password and fails with proper tRPC
 * codes. In production it refuses to operate on the repo-visible default
 * password — these procedures set money.
 */
const crmAdminProcedure = publicProcedure
  .input(z.object({ adminPassword: z.string() }))
  .use(async ({ input, next }) => {
    const { adminPassword } = input as { adminPassword: string };
    if (ENV.isProduction && !ENV.adminPasswordConfigured) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "ADMIN_PASSWORD is not configured on the server — admin access is disabled in production until it is set.",
      });
    }
    if (adminPassword !== ENV.adminPassword) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin password" });
    }
    return next();
  });

export const crmRouter = router({
  // The signed-in user's ambassador profile (created on first use).
  me: ambassadorProcedure.query(async ({ ctx }) => {
    const amb = ctx.ambassador;
    return {
      id: amb.id,
      referralCode: amb.referralCode,
      payoutMethodStatus: amb.payoutMethodStatus,
      active: amb.active,
      // Base for claim links/QR codes; the website claim flow reads
      // ?claim=<businessId>&amb=<code> (website PR #29).
      claimBaseUrl: ENV.websiteBaseUrl,
    };
  }),

  // Log a field visit (§5). claimed_onsite creates a `logged` claim and runs an
  // on-demand live-check; verification/attribution is still decided by the
  // business_users referral_code, never by who logged first.
  logVisit: ambassadorProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
        outcome: z.enum(CONVERSATION_RESULTS),
        spokeWithName: z.string().max(200).optional(),
        spokeWithRole: z.enum(["owner", "manager", "front_desk", "other"]).optional(),
        notes: z.string().max(4000).optional(),
        ownerEmailCaptured: z.string().max(320).optional(),
        ownerNameForFollowup: z.string().max(200).optional(),
        bestTimeToReturn: z.string().max(200).optional(),
        rung: z.number().int().min(1).max(8).optional(),
        photoUrls: z.array(z.string().url()).max(10).optional(),
        device: z.string().max(200).optional(),
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const amb = ctx.ambassador;
      // Derive what the system can know: a neutral touch-base is a first visit
      // or a follow-up depending on whether this business has been visited.
      const outcome =
        input.outcome === "neutral"
          ? (await hasPriorVisit(input.businessId)) ? "follow_up" : "first_visit"
          : input.outcome;
      const { visitId, loggedClaimId } = await createVisit(amb.id, {
        businessId: input.businessId,
        outcome,
        spokeWithName: input.spokeWithName ?? null,
        spokeWithRole: input.spokeWithRole ?? null,
        notes: input.notes ?? null,
        ownerEmailCaptured: input.ownerEmailCaptured ?? null,
        ownerNameForFollowup: input.ownerNameForFollowup ?? null,
        bestTimeToReturn: input.bestTimeToReturn ?? null,
        rung: input.rung ?? null,
        photoUrls: input.photoUrls ?? null,
        device: input.device ?? null,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
      });

      // A logged visit checks the business off today's route (best-effort).
      await markRouteStopDone(amb.id, input.businessId);

      // The system detects claims — the ambassador never declares one. Every
      // visit triggers a live check against the website, whatever the outcome:
      // if the owner scanned the QR and claimed while the ambassador was
      // standing there, it verifies on the spot.
      let liveCheck: string | null = null;
      try {
        const results = await reconcileLiveCheck(input.businessId);
        // Only a verified claim OWNED BY THIS AMBASSADOR counts — a claim
        // verified for someone else's code must not read as their success.
        const mine = results.some((r) => r.state === "verified" && r.ambassadorId === amb.id);
        const someoneElses = !mine && results.some((r) => r.state === "verified");
        if (mine) liveCheck = "verified";
        else if (someoneElses && outcome === "claimed_onsite") liveCheck = "already_attributed";
        else if (outcome === "claimed_onsite") liveCheck = "logged";
      } catch {
        if (outcome === "claimed_onsite") liveCheck = "pending"; // website unreachable — daily poll resolves it
      }
      return { visitId, loggedClaimId, liveCheck };
    }),

  myVisits: ambassadorProcedure.query(async ({ ctx }) => {
    return getVisitsByAmbassador(ctx.ambassador.id);
  }),

  // The ambassador's claims (logged → verified → paid) — visible money pipeline.
  myClaims: ambassadorProcedure.query(async ({ ctx }) => {
    return getClaimsByAmbassador(ctx.ambassador.id);
  }),

  // Ranked target queue (§6): unclaimed businesses, by distance (if located) or
  // confidence. Ambassador-gated: the directory is for certified field staff.
  targets: ambassadorProcedure
    .input(z.object({ lat: z.number().optional(), lng: z.number().optional(), limit: z.number().int().min(1).max(200).optional() }).optional())
    .query(async ({ input }) => {
      return getTargets({ lat: input?.lat ?? null, lng: input?.lng ?? null, limit: input?.limit });
    }),

  // Earnings dashboard (§7).
  earnings: ambassadorProcedure.query(async ({ ctx }) => {
    const amb = ctx.ambassador;
    const [earnings, followups, bounty] = await Promise.all([
      getEarnings(amb.id),
      getOpenFollowups(amb.id),
      getActiveBounty(),
    ]);
    return { ...earnings, openFollowups: followups, activeBountyCents: bounty?.amountCents ?? null };
  }),

  // ── Day routes (§2c) ─────────────────────────────────────────────────────
  route: ambassadorProcedure.query(async ({ ctx }) => getRoutePlan(ctx.ambassador.id)),

  buildRoute: ambassadorProcedure
    .input(
      z.object({
        lat: z.number().optional(),
        lng: z.number().optional(),
        count: z.number().int().min(1).max(20).optional(),
        includeFollowups: z.boolean().optional(),
      }).optional()
    )
    .mutation(async ({ ctx, input }) =>
      buildRoutePlan(ctx.ambassador.id, {
        lat: input?.lat ?? null,
        lng: input?.lng ?? null,
        count: input?.count,
        includeFollowups: input?.includeFollowups,
      })
    ),

  addRouteStop: ambassadorProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => addRouteStop(ctx.ambassador.id, input.businessId)),

  setRouteStopStatus: ambassadorProcedure
    .input(z.object({ businessId: z.string().uuid(), status: z.enum(["pending", "done", "skipped"]) }))
    .mutation(async ({ ctx, input }) => setRouteStopStatus(ctx.ambassador.id, input.businessId, input.status)),

  clearRoute: ambassadorProcedure.mutation(async ({ ctx }) => {
    await clearRoutePlan(ctx.ambassador.id);
    return { success: true };
  }),

  // Pre-call intel: what AI says about THIS business + door ammunition.
  // Cached 7 days; first generation takes a few seconds (three model calls).
  stopIntel: ambassadorProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ input }) => getStopIntel(input.businessId)),

  // Shift-scoped breadcrumb: only stored while today's route is active.
  recordPing: ambassadorProcedure
    .input(z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }))
    .mutation(async ({ ctx, input }) => {
      const tracked = await recordRoutePing(ctx.ambassador.id, input.lat, input.lng);
      return { tracked };
    }),

  // Curriculum-gap capture (§8).
  submitGap: ambassadorProcedure
    .input(z.object({ businessId: z.string().uuid().optional(), objectionText: z.string().min(1).max(2000), context: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      await submitCurriculumGap({
        ambassadorId: ctx.ambassador.id,
        businessId: input.businessId ?? null,
        objectionText: input.objectionText,
        context: input.context ?? null,
      });
      return { success: true };
    }),

  // ── Admin (shared password, validated by crmAdminProcedure middleware) ───
  adminGetActiveBounty: crmAdminProcedure.query(async () => {
    const b = await getActiveBounty();
    return { amountCents: b?.amountCents ?? null, effectiveFrom: b?.effectiveFrom ?? null };
  }),

  adminSetBounty: crmAdminProcedure
    .input(z.object({ amountCents: z.number().int().min(0).max(1_000_000) }))
    .mutation(async ({ input }) => {
      const b = await setBounty(input.amountCents);
      return { amountCents: b.amountCents, effectiveFrom: b.effectiveFrom, backfilledClaims: b.backfilledClaims };
    }),

  adminGetUpgradeBounties: crmAdminProcedure.query(async () => getUpgradeBountyConfig()),

  adminSetUpgradeBounty: crmAdminProcedure
    .input(z.object({ tier: z.enum(["enhanced", "premium", "growth_partner"]), amountCents: z.number().int().min(0).max(5_000_000) }))
    .mutation(async ({ input }) => setUpgradeBounty(input.tier, input.amountCents)),

  adminAnomalies: crmAdminProcedure.query(async () => getAnomalyClaims()),

  adminGaps: crmAdminProcedure.query(async () => getCurriculumGaps()),

  adminLeaderboard: crmAdminProcedure.query(async () => getLeaderboard()),

  adminAttributionLeak: crmAdminProcedure.query(async () => getAttributionLeakCount()),

  // ── Payouts: record that an ambassador was paid (money moves outside the app) ──
  adminUnpaidBalances: crmAdminProcedure.query(async () => getUnpaidBalances()),

  adminRecordPayout: crmAdminProcedure
    .input(z.object({ ambassadorId: z.number().int(), note: z.string().max(500).optional() }))
    .mutation(async ({ input }) => recordPayout(input.ambassadorId, input.note ?? null)),

  adminPayoutHistory: crmAdminProcedure.query(async () => getPayoutHistory()),
});
