import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DollarSign, Trophy, AlertTriangle, MessageSquareWarning, Radar, Loader2 } from "lucide-react";

const dollars = (cents: number | null | undefined) => `$${(((cents ?? 0) as number) / 100).toFixed(2)}`;

/**
 * Field CRM operations panel inside the supervisor dashboard. Password-gated
 * upstream (Admin.tsx holds adminPassword and passes it into every call —
 * crmAdminProcedure validates it server-side).
 */
const TIER_LABELS: Record<string, string> = {
  enhanced: "Enhanced ($29/mo)",
  premium: "Premium ($79/mo)",
  growth_partner: "Growth Partner ($299/mo)",
};

export function AdminCrm({ adminPassword }: { adminPassword: string }) {
  const utils = trpc.useUtils();
  const [bountyInput, setBountyInput] = useState("");
  const [tierInputs, setTierInputs] = useState<Record<string, string>>({});

  const auth = { adminPassword };
  const bounty = trpc.crm.adminGetActiveBounty.useQuery(auth);
  const upgradeBounties = trpc.crm.adminGetUpgradeBounties.useQuery(auth);
  const setUpgradeBounty = trpc.crm.adminSetUpgradeBounty.useMutation({
    onSuccess: (r) => {
      toast.success(
        `${TIER_LABELS[r.tier] ?? r.tier} bonus set to ${dollars(r.amountCents)}` +
          (r.backfilledBonuses > 0 ? ` — ${r.backfilledBonuses} earlier bonus(es) backfilled.` : ".")
      );
      setTierInputs((v) => ({ ...v, [r.tier]: "" }));
      utils.crm.adminGetUpgradeBounties.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const submitTierBounty = (tier: "enhanced" | "premium" | "growth_partner") => {
    const amount = Number.parseFloat(tierInputs[tier] ?? "");
    if (!Number.isFinite(amount) || amount < 0) return toast.error("Enter a dollar amount.");
    setUpgradeBounty.mutate({ adminPassword, tier, amountCents: Math.round(amount * 100) });
  };
  const leaderboard = trpc.crm.adminLeaderboard.useQuery(auth);
  const anomalies = trpc.crm.adminAnomalies.useQuery(auth);
  const gaps = trpc.crm.adminGaps.useQuery(auth);
  const leak = trpc.crm.adminAttributionLeak.useQuery(auth);

  const setBounty = trpc.crm.adminSetBounty.useMutation({
    onSuccess: (r) => {
      toast.success(
        `Bounty set to ${dollars(r.amountCents)} per verified claim` +
          (r.backfilledClaims > 0 ? ` — ${r.backfilledClaims} earlier verified claim(s) backfilled.` : ".")
      );
      setBountyInput("");
      utils.crm.adminGetActiveBounty.invalidate();
      utils.crm.adminLeaderboard.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const submitBounty = () => {
    const amount = Number.parseFloat(bountyInput);
    if (!Number.isFinite(amount) || amount < 0) return toast.error("Enter a dollar amount, e.g. 50");
    const cents = Math.round(amount * 100);
    if (!confirm(`Set the bounty to ${dollars(cents)} per verified claim? This applies to new verifications and backfills any verified claims that predate a bounty.`)) return;
    setBounty.mutate({ adminPassword, amountCents: cents });
  };

  const card = "bg-white rounded-xl border border-slate-200 p-5 shadow-sm";

  return (
    <div className="flex flex-col gap-4">
      {/* Bounty */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-amber-600" />
          <h3 className="font-serif font-bold text-slate-800">Claim Bounty</h3>
        </div>
        <p className="text-sm text-slate-600 mb-3">
          Currently:{" "}
          <span className="font-bold text-slate-800">
            {bounty.isLoading ? "…" : bounty.data?.amountCents != null ? `${dollars(bounty.data.amountCents)} per verified claim` : "not set — verified claims accrue at $0 until you set it (they backfill when you do)"}
          </span>
          {bounty.data?.effectiveFrom && (
            <span className="text-xs text-slate-400"> · since {new Date(bounty.data.effectiveFrom).toLocaleDateString()}</span>
          )}
        </p>
        <div className="flex gap-2 max-w-xs">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              inputMode="decimal"
              placeholder="50"
              value={bountyInput}
              onChange={(e) => setBountyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitBounty()}
              className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <Button onClick={submitBounty} disabled={setBounty.isPending || !bountyInput} style={{ background: "oklch(0.22 0.01 65)", color: "white" }}>
            {setBounty.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set bounty"}
          </Button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100">
          <h4 className="text-sm font-bold text-slate-700 mb-1">Upgrade bonuses</h4>
          <p className="text-xs text-slate-500 mb-3">
            Paid when a business an ambassador claimed moves to a paid tier within 90 days. The nightly sync detects upgrades automatically.
          </p>
          {(["enhanced", "premium", "growth_partner"] as const).map((tier) => (
            <div key={tier} className="flex items-center gap-2 py-1.5">
              <span className="text-sm text-slate-600 w-52">{TIER_LABELS[tier]}</span>
              <span className="text-sm font-bold text-slate-800 w-20">
                {upgradeBounties.isLoading ? "…" : upgradeBounties.data?.[tier] != null ? dollars(upgradeBounties.data[tier]) : "not set"}
              </span>
              <div className="relative w-24">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  inputMode="decimal"
                  value={tierInputs[tier] ?? ""}
                  onChange={(e) => setTierInputs((v) => ({ ...v, [tier]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && submitTierBounty(tier)}
                  className="w-full border border-slate-300 rounded-lg pl-6 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <Button size="sm" variant="outline" disabled={setUpgradeBounty.isPending || !tierInputs[tier]} onClick={() => submitTierBounty(tier)}>
                Set
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-600" />
          <h3 className="font-serif font-bold text-slate-800">Ambassador Leaderboard</h3>
        </div>
        {leaderboard.isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {leaderboard.data?.length === 0 && <p className="text-sm text-slate-400">No claims yet — the board fills in as ambassadors work the field.</p>}
        {(leaderboard.data ?? []).map((row, i) => (
          <div key={row.ambassadorId ?? i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-6 text-center font-bold text-slate-400 text-sm">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{row.name ?? "(unknown)"}</p>
                <p className="text-xs text-slate-400 font-mono">{row.referralCode}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-slate-800">{row.verified} verified</p>
              <p className="text-xs text-emerald-600 font-semibold">{dollars(row.earnedCents)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Anomalies */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h3 className="font-serif font-bold text-slate-800">Anomaly Claims</h3>
          <span className="text-xs text-slate-400">claims whose referral code matches no ambassador — review for typos or misuse</span>
        </div>
        {anomalies.data?.length === 0 && <p className="text-sm text-slate-400">None — every attributed claim matched a real ambassador code.</p>}
        {(anomalies.data ?? []).map((a) => (
          <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{a.businessName ?? a.businessId}</p>
              <p className="text-xs text-slate-400">{a.businessCity ?? ""} · via {a.verificationSource ?? "?"}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-mono font-bold text-red-600">{a.referralCode}</p>
              <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Curriculum gaps */}
      <div className={card}>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquareWarning className="w-4 h-4 text-amber-600" />
          <h3 className="font-serif font-bold text-slate-800">Objections From the Field</h3>
          <span className="text-xs text-slate-400">what ambassadors couldn't answer — feed these into training</span>
        </div>
        {gaps.data?.length === 0 && <p className="text-sm text-slate-400">None yet.</p>}
        {(gaps.data ?? []).map((g) => (
          <div key={g.id} className="py-2 border-b border-slate-100 last:border-0">
            <p className="text-sm text-slate-700 leading-relaxed">“{g.objectionText}”</p>
            <p className="text-xs text-slate-400 mt-1">
              {[g.ambassadorName, g.businessName, new Date(g.createdAt).toLocaleDateString()].filter(Boolean).join(" · ")}
              <span className={`ml-2 uppercase font-bold ${g.status === "new" ? "text-amber-600" : "text-slate-400"}`}>{g.status}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Attribution leak monitor */}
      <div className={card}>
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-amber-600" />
          <h3 className="font-serif font-bold text-slate-800">Attribution Leak Monitor</h3>
        </div>
        <p className="text-sm text-slate-600 mt-2">
          {leak.data == null
            ? "Loading…"
            : !leak.data.configured
              ? "PostHog not configured — set POSTHOG_API_KEY / POSTHOG_PROJECT_ID to count claims that dropped their ambassador code mid-flow."
              : leak.data.count == null
                ? `Configured, but the count is unavailable (${"note" in leak.data ? leak.data.note : "unknown error"}).`
                : `${leak.data.count} ambassador_attribution_dropped event(s) — claims where the code was lost before signup completed.`}
        </p>
      </div>
    </div>
  );
}
