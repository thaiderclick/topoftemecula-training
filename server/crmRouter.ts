/**
 * Ambassador Field CRM — tRPC router (Phase 1).
 * Ambassador-facing procedures resolve the ambassador from the session user
 * (issuing a referral code on first use). Admin procedures gate on the shared
 * admin password (matching the existing admin/feedback pattern).
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import {
  createVisit,
  ensureAmbassador,
  getActiveBounty,
  getAnomalyClaims,
  getCurriculumGaps,
  getEarnings,
  getLeaderboard,
  getOpenFollowups,
  getTargets,
  getVisitsByAmbassador,
  setBounty,
  submitCurriculumGap,
} from "./crmDb";
import { reconcileLiveCheck } from "./reconciliation";
import { getAttributionLeakCount } from "./monitoring";

const VISIT_OUTCOMES = [
  "first_visit",
  "follow_up",
  "claimed_onsite",
  "not_interested_no_revisit",
  "left_info_needs_followup",
  "no_decision_maker",
] as const;

function requireAdmin(password: string) {
  if (password !== ENV.adminPassword) throw new Error("Unauthorized");
}

export const crmRouter = router({
  // The signed-in user's ambassador profile (created on first use).
  me: protectedProcedure.query(async ({ ctx }) => {
    const amb = await ensureAmbassador(ctx.user.id, ctx.user.name ?? null);
    return { id: amb.id, referralCode: amb.referralCode, payoutMethodStatus: amb.payoutMethodStatus, active: amb.active };
  }),

  // Log a field visit (§5). claimed_onsite creates a `logged` claim and runs an
  // on-demand live-check; verification/attribution is still decided by the
  // business_users referral_code, never by who logged first.
  logVisit: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
        outcome: z.enum(VISIT_OUTCOMES),
        spokeWithName: z.string().max(200).optional(),
        spokeWithRole: z.enum(["owner", "manager", "front_desk", "other"]).optional(),
        notes: z.string().max(4000).optional(),
        ownerEmailCaptured: z.string().max(320).optional(),
        ownerNameForFollowup: z.string().max(200).optional(),
        bestTimeToReturn: z.string().max(200).optional(),
        rung: z.number().int().min(1).max(8).optional(),
        photoUrls: z.array(z.string().url()).max(10).optional(),
        device: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const amb = await ensureAmbassador(ctx.user.id, ctx.user.name ?? null);
      const { visitId, loggedClaimId } = await createVisit(amb.id, {
        businessId: input.businessId,
        outcome: input.outcome,
        spokeWithName: input.spokeWithName ?? null,
        spokeWithRole: input.spokeWithRole ?? null,
        notes: input.notes ?? null,
        ownerEmailCaptured: input.ownerEmailCaptured ?? null,
        ownerNameForFollowup: input.ownerNameForFollowup ?? null,
        bestTimeToReturn: input.bestTimeToReturn ?? null,
        rung: input.rung ?? null,
        photoUrls: input.photoUrls ?? null,
        device: input.device ?? null,
      });

      let liveCheck: string | null = null;
      if (input.outcome === "claimed_onsite") {
        try {
          const results = await reconcileLiveCheck(input.businessId);
          const verified = results.find((r) => r.state === "verified");
          liveCheck = verified ? "verified" : "logged";
        } catch {
          liveCheck = "pending"; // website unreachable — daily poll will resolve it
        }
      }
      return { visitId, loggedClaimId, liveCheck };
    }),

  myVisits: protectedProcedure.query(async ({ ctx }) => {
    const amb = await ensureAmbassador(ctx.user.id, ctx.user.name ?? null);
    return getVisitsByAmbassador(amb.id);
  }),

  // Ranked target queue (§6): unclaimed businesses, by distance (if located) or confidence.
  targets: protectedProcedure
    .input(z.object({ lat: z.number().optional(), lng: z.number().optional(), limit: z.number().int().min(1).max(200).optional() }).optional())
    .query(async ({ input }) => {
      return getTargets({ lat: input?.lat ?? null, lng: input?.lng ?? null, limit: input?.limit });
    }),

  // Earnings dashboard (§7).
  earnings: protectedProcedure.query(async ({ ctx }) => {
    const amb = await ensureAmbassador(ctx.user.id, ctx.user.name ?? null);
    const [earnings, followups, bounty] = await Promise.all([
      getEarnings(amb.id),
      getOpenFollowups(amb.id),
      getActiveBounty(),
    ]);
    return { ...earnings, openFollowups: followups, activeBountyCents: bounty?.amountCents ?? null };
  }),

  // Curriculum-gap capture (§8).
  submitGap: protectedProcedure
    .input(z.object({ businessId: z.string().uuid().optional(), objectionText: z.string().min(1).max(2000), context: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const amb = await ensureAmbassador(ctx.user.id, ctx.user.name ?? null);
      await submitCurriculumGap({
        ambassadorId: amb.id,
        businessId: input.businessId ?? null,
        objectionText: input.objectionText,
        context: input.context ?? null,
      });
      return { success: true };
    }),

  // ── Admin (shared password) ──────────────────────────────────────────────
  adminGetActiveBounty: publicProcedure
    .input(z.object({ adminPassword: z.string() }))
    .query(async ({ input }) => {
      requireAdmin(input.adminPassword);
      const b = await getActiveBounty();
      return { amountCents: b?.amountCents ?? null, effectiveFrom: b?.effectiveFrom ?? null };
    }),

  adminSetBounty: publicProcedure
    .input(z.object({ adminPassword: z.string(), amountCents: z.number().int().min(0).max(1_000_000) }))
    .mutation(async ({ input }) => {
      requireAdmin(input.adminPassword);
      const b = await setBounty(input.amountCents);
      return { amountCents: b.amountCents, effectiveFrom: b.effectiveFrom };
    }),

  adminAnomalies: publicProcedure
    .input(z.object({ adminPassword: z.string() }))
    .query(async ({ input }) => {
      requireAdmin(input.adminPassword);
      return getAnomalyClaims();
    }),

  adminGaps: publicProcedure
    .input(z.object({ adminPassword: z.string() }))
    .query(async ({ input }) => {
      requireAdmin(input.adminPassword);
      return getCurriculumGaps();
    }),

  adminLeaderboard: publicProcedure
    .input(z.object({ adminPassword: z.string() }))
    .query(async ({ input }) => {
      requireAdmin(input.adminPassword);
      return getLeaderboard();
    }),

  adminAttributionLeak: publicProcedure
    .input(z.object({ adminPassword: z.string() }))
    .query(async ({ input }) => {
      requireAdmin(input.adminPassword);
      return getAttributionLeakCount();
    }),
});
