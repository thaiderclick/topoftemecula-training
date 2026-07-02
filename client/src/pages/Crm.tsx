import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PasswordGate } from "@/components/PasswordGate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, MapPin, DollarSign, ClipboardCheck, MessageSquareWarning, Navigation, History } from "lucide-react";

const OUTCOMES: { value: string; label: string; hint?: string }[] = [
  { value: "claimed_onsite", label: "Claimed on-site 🎉", hint: "Owner claimed while you were there" },
  { value: "first_visit", label: "First visit" },
  { value: "follow_up", label: "Follow-up visit" },
  { value: "left_info_needs_followup", label: "Left info — needs follow-up" },
  { value: "no_decision_maker", label: "No decision-maker present" },
  { value: "not_interested_no_revisit", label: "Not interested — no revisit" },
];

const dollars = (cents: number | null | undefined) =>
  `$${(((cents ?? 0) as number) / 100).toFixed(2)}`;

function VisitForm({ businessId, businessName, onDone }: { businessId: string; businessName: string; onDone: () => void }) {
  const utils = trpc.useUtils();
  const [outcome, setOutcome] = useState("first_visit");
  const [spokeWithName, setSpokeWithName] = useState("");
  const [spokeWithRole, setSpokeWithRole] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [bestTime, setBestTime] = useState("");

  const logVisit = trpc.crm.logVisit.useMutation({
    onSuccess: (r) => {
      if (r.liveCheck === "verified") toast.success("Visit logged — claim verified instantly! 🎉");
      else if (r.liveCheck === "already_attributed")
        toast.info("Visit logged — this business's claim is already attributed to another referral code.");
      else if (r.liveCheck) toast.success("Visit logged — claim pending owner completion.");
      else toast.success("Visit logged.");
      utils.crm.earnings.invalidate();
      utils.crm.myVisits.invalidate();
      utils.crm.targets.invalidate();
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });

  const showFollowupFields = outcome === "no_decision_maker" || outcome === "left_info_needs_followup";

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-border/60 pt-3">
      <div className="grid grid-cols-1 gap-1.5">
        {OUTCOMES.map((o) => (
          <button
            key={o.value}
            onClick={() => setOutcome(o.value)}
            className={`text-left rounded-lg px-3 py-2 text-sm border transition ${
              outcome === o.value ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background"
            }`}
          >
            {o.label}
            {o.hint && <span className="block text-[11px] text-muted-foreground font-normal">{o.hint}</span>}
          </button>
        ))}
      </div>

      <input
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        placeholder="Who did you speak with? (name)"
        value={spokeWithName}
        onChange={(e) => setSpokeWithName(e.target.value)}
      />
      <div className="flex gap-2">
        {["owner", "manager", "front_desk", "other"].map((r) => (
          <button
            key={r}
            onClick={() => setSpokeWithRole(spokeWithRole === r ? "" : r)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs border ${spokeWithRole === r ? "border-primary bg-primary/10 font-semibold" : "border-border"}`}
          >
            {r.replace("_", " ")}
          </button>
        ))}
      </div>

      {showFollowupFields && (
        <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-2">
          <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Owner email captured (Rung 5)" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
          <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Owner name for follow-up (Rung 6)" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Best time to return" value={bestTime} onChange={(e) => setBestTime(e.target.value)} />
        </div>
      )}

      <textarea
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[60px]"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onDone} disabled={logVisit.isPending}>Cancel</Button>
        <Button
          className="flex-1"
          disabled={logVisit.isPending}
          onClick={() =>
            logVisit.mutate({
              businessId,
              outcome: outcome as never,
              spokeWithName: spokeWithName || undefined,
              spokeWithRole: (spokeWithRole || undefined) as never,
              notes: notes || undefined,
              ownerEmailCaptured: ownerEmail || undefined,
              ownerNameForFollowup: ownerName || undefined,
              bestTimeToReturn: bestTime || undefined,
              device: navigator.userAgent.slice(0, 180),
            })
          }
        >
          {logVisit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Log visit — ${businessName.slice(0, 18)}`}
        </Button>
      </div>
    </div>
  );
}

export default function Crm() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [openVisitFor, setOpenVisitFor] = useState<string | null>(null);
  const [gapText, setGapText] = useState("");

  const me = trpc.crm.me.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const earnings = trpc.crm.earnings.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const myVisits = trpc.crm.myVisits.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const targets = trpc.crm.targets.useQuery(
    coords ? { lat: coords.lat, lng: coords.lng, limit: 25 } : { limit: 25 },
    { enabled: isAuthenticated, retry: false }
  );
  const utils = trpc.useUtils();
  const submitGap = trpc.crm.submitGap.useMutation({
    onSuccess: () => { toast.success("Objection logged for the training team."); setGapText(""); },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!isAuthenticated) {
    return <PasswordGate onSuccess={() => { me.refetch(); earnings.refetch(); }} />;
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not available on this device.");
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => toast.error("Couldn't get your location."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const e = earnings.data;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">Top of Temecula · Field CRM</p>
        <h1 className="text-2xl font-serif font-extrabold text-foreground">Your Field Dashboard</h1>
        {me.data && (
          <p className="text-sm text-muted-foreground mt-1">
            Your referral code: <span className="font-mono font-bold text-foreground">{me.data.referralCode}</span>
          </p>
        )}

        {/* Earnings */}
        <Card className="mt-4 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3"><DollarSign className="w-4 h-4 text-primary" /> Earnings</div>
          {earnings.isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-lg font-bold text-emerald-600">{dollars(e?.paidCents)}</p><p className="text-[10px] uppercase text-muted-foreground">Paid</p></div>
              <div><p className="text-lg font-bold text-amber-600">{dollars(e?.verifiedUnpaidCents)}</p><p className="text-[10px] uppercase text-muted-foreground">Verified · unpaid</p></div>
              <div><p className="text-lg font-bold text-muted-foreground">{e?.pendingCount ?? 0}</p><p className="text-[10px] uppercase text-muted-foreground">Pending</p></div>
            </div>
          )}
          {e && (
            <div className="mt-3 flex justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-2">
              <span>{e.verifiedCount} verified claims</span>
              <span>{e.conversionPct}% conversion</span>
              <span>{e.activeBountyCents == null ? "bounty: not set" : `${dollars(e.activeBountyCents)}/claim`}</span>
            </div>
          )}
        </Card>

        {/* Target queue */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><MapPin className="w-4 h-4 text-primary" /> Businesses to work</div>
          <Button size="sm" variant="outline" onClick={useMyLocation}><Navigation className="w-3.5 h-3.5 mr-1" />{coords ? "Near me ✓" : "Near me"}</Button>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          {targets.isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto my-4" />}
          {targets.data?.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No unclaimed businesses found. Run the directory sync.</p>}
          {targets.data?.map((b) => (
            <Card key={b.businessId} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{b.name ?? "(unnamed)"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {[b.city, b.address].filter(Boolean).join(" · ") || "—"}
                    {b.distanceMiles != null && <> · {b.distanceMiles.toFixed(1)} mi</>}
                  </p>
                </div>
                <Button size="sm" variant={openVisitFor === b.businessId ? "secondary" : "default"} onClick={() => setOpenVisitFor(openVisitFor === b.businessId ? null : b.businessId)}>
                  <ClipboardCheck className="w-3.5 h-3.5 mr-1" />Visit
                </Button>
              </div>
              {openVisitFor === b.businessId && (
                <VisitForm businessId={b.businessId} businessName={b.name ?? "business"} onDone={() => setOpenVisitFor(null)} />
              )}
            </Card>
          ))}
        </div>

        {/* Recent visits */}
        {(myVisits.data?.length ?? 0) > 0 && (
          <Card className="mt-6 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              <History className="w-4 h-4 text-primary" /> Recent visits
            </div>
            <div className="flex flex-col divide-y divide-border/60">
              {myVisits.data!.slice(0, 15).map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2 py-1.5">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{v.businessName ?? "(unnamed)"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {OUTCOMES.find((o) => o.value === v.outcome)?.label ?? v.outcome}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Curriculum gap */}
        <Card className="mt-6 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><MessageSquareWarning className="w-4 h-4 text-primary" /> Objection you couldn't answer?</div>
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[56px]"
            placeholder="Type the objection — it goes straight to the training team."
            value={gapText}
            onChange={(ev) => setGapText(ev.target.value)}
          />
          <Button size="sm" className="mt-2 w-full" disabled={!gapText.trim() || submitGap.isPending} onClick={() => submitGap.mutate({ objectionText: gapText.trim() })}>
            {submitGap.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send to training team"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
