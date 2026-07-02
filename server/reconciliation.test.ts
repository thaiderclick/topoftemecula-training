import { describe, expect, it } from "vitest";
import { decideReconciliation } from "./reconciliation";

// The pure §4 decision. `ambassadorId` is what the caller resolves via a citext
// `=` in SQL — case-insensitivity lives in the DB, so these tests assert the
// branching, not string normalization (there is none in app code).
describe("decideReconciliation (§4 branching)", () => {
  const NULL_IN = { existingBySource: null, ambassadorId: null, loggedClaim: null };

  it("known code + matching ambassador → verified, attributed", () => {
    expect(
      decideReconciliation({ referral_code: "DYLAN" }, { ...NULL_IN, ambassadorId: 7 })
    ).toEqual({ kind: "verified", ambassadorId: 7, upgradeClaimId: undefined });
  });

  it("known code + a prior logged claim → verified UPGRADE of that claim", () => {
    expect(
      decideReconciliation({ referral_code: "DYLAN" }, { existingBySource: null, ambassadorId: 7, loggedClaim: { id: 42 } })
    ).toEqual({ kind: "verified", ambassadorId: 7, upgradeClaimId: 42 });
  });

  it("NULL referral → unattributed (never pays)", () => {
    expect(decideReconciliation({ referral_code: null }, NULL_IN)).toEqual({ kind: "unattributed" });
  });

  it("unknown code (no ambassador owns it) → anomaly (never silently paid)", () => {
    expect(
      decideReconciliation({ referral_code: "GHOST99" }, { ...NULL_IN, ambassadorId: null })
    ).toEqual({ kind: "anomaly" });
  });

  it("idempotent: a claim already tied to this source row → no new claim", () => {
    expect(
      decideReconciliation({ referral_code: "DYLAN" }, { existingBySource: { id: 99 }, ambassadorId: 7, loggedClaim: null })
    ).toEqual({ kind: "idempotent", claimId: 99 });
  });

  it("idempotency wins even over a NULL/unknown code (source row already handled)", () => {
    expect(
      decideReconciliation({ referral_code: null }, { existingBySource: { id: 5 }, ambassadorId: null, loggedClaim: null })
    ).toEqual({ kind: "idempotent", claimId: 5 });
  });
});
