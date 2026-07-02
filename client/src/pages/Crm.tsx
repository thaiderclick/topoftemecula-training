import { useMemo, useState } from "react";
import { Link } from "wouter";
import QRCode from "react-qr-code";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Loader2, MapPin, DollarSign, ClipboardCheck, MessageSquareWarning, Navigation,
  History, GraduationCap, LogOut, Lock, QrCode, Share2, Copy, X, ClipboardList, BadgeCheck,
  Route as RouteIcon, Check, RotateCcw, Trash2, PlusCircle, Flag,
} from "lucide-react";

const OUTCOMES: { value: string; label: string; hint?: string }[] = [
  { value: "claimed_onsite", label: "Claimed on-site 🎉", hint: "Owner claimed while you were there" },
  { value: "first_visit", label: "First visit" },
  { value: "follow_up", label: "Follow-up visit" },
  { value: "left_info_needs_followup", label: "Left info — needs follow-up" },
  { value: "no_decision_maker", label: "No decision-maker present" },
  { value: "not_interested_no_revisit", label: "Not interested — no revisit" },
];

const FOLLOWUP_OUTCOMES = new Set(["left_info_needs_followup", "no_decision_maker"]);

const dollars = (cents: number | null | undefined) =>
  `$${(((cents ?? 0) as number) / 100).toFixed(2)}`;

/** The link the business owner opens: the website claim flow reads ?claim & ?amb. */
function claimUrl(base: string, code: string, businessId?: string) {
  const url = new URL("/business/signup", base);
  if (businessId) url.searchParams.set("claim", businessId);
  url.searchParams.set("amb", code);
  return url.toString();
}

interface RouteStopView {
  businessId: string;
  status: "pending" | "done" | "skipped";
  name: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  distanceFromPrevMiles: number | null;
}

/** Deep link into the phone's native maps app (Apple on iOS, Google elsewhere). */
function directionsUrl(stop: Pick<RouteStopView, "lat" | "lng" | "name" | "address" | "city">): string {
  const dest =
    stop.lat != null && stop.lng != null
      ? `${stop.lat},${stop.lng}`
      : [stop.name, stop.address, stop.city].filter(Boolean).join(", ");
  const isApple = /iPhone|iPad|iPod/.test(navigator.userAgent);
  return isApple
    ? `https://maps.apple.com/?daddr=${encodeURIComponent(dest)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

/** One Google Maps link through every remaining stop (waypoint cap ~9). */
function navigateAllUrl(stops: RouteStopView[]): string | null {
  const pts = stops.filter((s) => s.status === "pending" && s.lat != null && s.lng != null).map((s) => `${s.lat},${s.lng}`);
  if (pts.length < 2) return null;
  const dest = pts[pts.length - 1];
  const waypoints = pts.slice(0, -1).slice(0, 9).join("|");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&waypoints=${encodeURIComponent(waypoints)}`;
}

async function shareOrCopy(url: string, title: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      /* user cancelled — fall through to copy */
    }
  }
  await navigator.clipboard?.writeText(url);
  toast.success("Link copied.");
}

/** Full-screen QR the owner scans with their phone camera — the money moment. */
function ClaimQrModal({ base, code, business, onClose }: {
  base: string;
  code: string;
  business: { businessId: string; name: string | null };
  onClose: () => void;
}) {
  const url = claimUrl(base, code, business.businessId);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <Card className="max-w-sm w-full p-6 flex flex-col items-center gap-4 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">Scan to claim</p>
        <h2 className="text-lg font-serif font-bold text-foreground text-center leading-tight">{business.name ?? "This business"}</h2>
        <div className="bg-white p-4 rounded-xl">
          <QRCode value={url} size={216} />
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          The owner scans this with their phone camera — your code <span className="font-mono font-bold text-foreground">{code}</span> rides along automatically.
        </p>
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1 gap-1.5" onClick={() => { navigator.clipboard?.writeText(url); toast.success("Claim link copied."); }}>
            <Copy className="w-4 h-4" /> Copy link
          </Button>
          <Button className="flex-1 gap-1.5" onClick={() => shareOrCopy(url, `Claim ${business.name ?? "your business"} on Top of Temecula`)}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>
      </Card>
    </div>
  );
}

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
      utils.crm.myClaims.invalidate();
      utils.crm.targets.invalidate();
      utils.crm.route.invalidate();
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

const CLAIM_STATE_STYLE: Record<string, { label: string; cls: string }> = {
  logged: { label: "Pending", cls: "bg-muted text-muted-foreground" },
  verified: { label: "Verified ✓", cls: "bg-emerald-100 text-emerald-700" },
  paid: { label: "Paid", cls: "bg-emerald-600 text-white" },
  unattributed: { label: "Unattributed", cls: "bg-amber-100 text-amber-700" },
  anomaly: { label: "Under review", cls: "bg-amber-100 text-amber-700" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
};

type Tab = "targets" | "route" | "pipeline" | "earnings";

export default function Crm() {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("targets");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [openVisitFor, setOpenVisitFor] = useState<string | null>(null);
  const [qrFor, setQrFor] = useState<{ businessId: string; name: string | null } | null>(null);
  const [gapText, setGapText] = useState("");

  const me = trpc.crm.me.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const earnings = trpc.crm.earnings.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const myVisits = trpc.crm.myVisits.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const myClaims = trpc.crm.myClaims.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const targets = trpc.crm.targets.useQuery(
    coords ? { lat: coords.lat, lng: coords.lng, limit: 25 } : { limit: 25 },
    { enabled: isAuthenticated, retry: false }
  );
  const submitGap = trpc.crm.submitGap.useMutation({
    onSuccess: () => { toast.success("Objection logged for the training team."); setGapText(""); },
    onError: (e) => toast.error(e.message),
  });

  const route = trpc.crm.route.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const utils = trpc.useUtils();
  const [routeCount, setRouteCount] = useState(8);
  const buildRoute = trpc.crm.buildRoute.useMutation({
    onSuccess: () => { utils.crm.route.invalidate(); toast.success("Route built — nearest first."); },
    onError: (err) => toast.error(err.message),
  });
  const addStop = trpc.crm.addRouteStop.useMutation({
    onSuccess: () => { utils.crm.route.invalidate(); toast.success("Added to today's route."); },
    onError: (err) => toast.error(err.message),
  });
  const setStopStatus = trpc.crm.setRouteStopStatus.useMutation({
    onSuccess: () => utils.crm.route.invalidate(),
    onError: (err) => toast.error(err.message),
  });
  const clearRoute = trpc.crm.clearRoute.useMutation({
    onSuccess: () => utils.crm.route.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const buildNearMe = () => {
    if (!navigator.geolocation) {
      buildRoute.mutate({ count: routeCount });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        buildRoute.mutate({ lat: p.coords.latitude, lng: p.coords.longitude, count: routeCount });
      },
      () => {
        toast.info("No location — building by confidence instead of distance.");
        buildRoute.mutate({ count: routeCount });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Latest visit per business that still needs a follow-up (and isn't claimed yet).
  const followupsNeeded = useMemo(() => {
    const seen = new Set<string>();
    const out: NonNullable<typeof myVisits.data> = [];
    for (const v of myVisits.data ?? []) {
      if (seen.has(v.businessId)) continue;
      seen.add(v.businessId);
      if (FOLLOWUP_OUTCOMES.has(v.outcome) && v.localClaimStatus !== "claimed") out.push(v);
    }
    return out;
  }, [myVisits.data]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!isAuthenticated) {
    return <AuthGate onSuccess={() => { me.refetch(); earnings.refetch(); }} />;
  }

  // Field access is certification-gated server-side; show the path forward
  // instead of raw errors when a trainee lands here early.
  if (me.error?.data?.code === "FORBIDDEN") {
    const deactivated = me.error.message.startsWith("DEACTIVATED");
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full p-8 text-center flex flex-col items-center gap-4">
          <Lock className="w-10 h-10 text-primary" />
          <h1 className="text-xl font-serif font-extrabold text-foreground">
            {deactivated ? "Account deactivated" : "The Field CRM unlocks at certification"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {deactivated
              ? "Your ambassador account has been deactivated. Contact your coordinator if you think this is a mistake."
              : "Finish the training modules and pass the final test — your certificate is the key to the field toolkit."}
          </p>
          {!deactivated && (
            <Link href="/learn">
              <Button className="rounded-xl gap-2"><GraduationCap className="w-4 h-4" /> Go to training</Button>
            </Link>
          )}
        </Card>
      </div>
    );
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
  const code = me.data?.referralCode;
  const base = me.data?.claimBaseUrl;
  const canShare = !!(code && base);

  const targetCard = (b: { businessId: string; name: string | null; city: string | null; address: string | null; distanceMiles: number | null }) => (
    <Card key={b.businessId} className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{b.name ?? "(unnamed)"}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {[b.city, b.address].filter(Boolean).join(" · ") || "—"}
            {b.distanceMiles != null && <> · {b.distanceMiles.toFixed(1)} mi</>}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button
            size="sm" variant="outline" title="Add to today's route"
            disabled={addStop.isPending || route.data?.stops.some((s) => s.businessId === b.businessId)}
            onClick={() => addStop.mutate({ businessId: b.businessId })}
          >
            <PlusCircle className="w-3.5 h-3.5" />
          </Button>
          {canShare && (
            <Button size="sm" variant="outline" onClick={() => setQrFor({ businessId: b.businessId, name: b.name })}>
              <QrCode className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button size="sm" variant={openVisitFor === b.businessId ? "secondary" : "default"} onClick={() => setOpenVisitFor(openVisitFor === b.businessId ? null : b.businessId)}>
            <ClipboardCheck className="w-3.5 h-3.5 mr-1" />Visit
          </Button>
        </div>
      </div>
      {openVisitFor === b.businessId && (
        <VisitForm businessId={b.businessId} businessName={b.name ?? "business"} onDone={() => setOpenVisitFor(null)} />
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">Top of Temecula · Field CRM</p>
          <div className="flex items-center gap-3">
            <Link href="/learn" className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> Learning Center
            </Link>
            <button onClick={logout} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-serif font-extrabold text-foreground">Your Field Dashboard</h1>
        {me.data && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            Your referral code: <span className="font-mono font-bold text-foreground">{me.data.referralCode}</span>
            {canShare && (
              <button
                onClick={() => { navigator.clipboard?.writeText(claimUrl(base!, code!)); toast.success("Your general referral link is copied — good for texts, bios, and business cards."); }}
                className="text-primary hover:text-primary/80"
                title="Copy your referral link"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
          </p>
        )}

        {/* ── Targets tab ── */}
        {tab === "targets" && (
          <>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><MapPin className="w-4 h-4 text-primary" /> Businesses to work</div>
              <Button size="sm" variant="outline" onClick={useMyLocation}><Navigation className="w-3.5 h-3.5 mr-1" />{coords ? "Near me ✓" : "Near me"}</Button>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {targets.isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto my-4" />}
              {targets.data?.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No unclaimed businesses found. Run the directory sync.</p>}
              {targets.data?.map(targetCard)}
            </div>
          </>
        )}

        {/* ── Route tab ── */}
        {tab === "route" && (
          <>
            {route.isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto my-8" />}

            {!route.isLoading && !route.data && (
              <Card className="mt-5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1"><RouteIcon className="w-4 h-4 text-primary" /> Plan your day</div>
                <p className="text-[12px] text-muted-foreground mb-3">
                  Builds today's route from your open follow-ups plus the nearest unclaimed businesses, ordered so you're never backtracking.
                </p>
                <div className="flex gap-2 mb-3">
                  {[5, 8, 10, 15].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRouteCount(n)}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-sm border ${routeCount === n ? "border-primary bg-primary/10 font-semibold" : "border-border"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <Button className="w-full gap-2" disabled={buildRoute.isPending} onClick={buildNearMe}>
                  {buildRoute.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Navigation className="w-4 h-4" /> Build {routeCount} stops near me</>}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-2 text-center">You can also add specific businesses from the Targets tab with <PlusCircle className="w-3 h-3 inline" />.</p>
              </Card>
            )}

            {route.data && (
              <>
                {route.data.status === "completed" && (
                  <Card className="mt-5 p-4 border-emerald-300 bg-emerald-50/50">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><Flag className="w-4 h-4" /> Route complete — great day!</div>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {route.data.stops.filter((s) => s.status === "done").length} visited
                      {route.data.stops.some((s) => s.status === "skipped") && <> · {route.data.stops.filter((s) => s.status === "skipped").length} skipped</>}
                      {" "}— check the Earnings tab for claims in motion, then build tomorrow's route fresh.
                    </p>
                  </Card>
                )}

                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <RouteIcon className="w-4 h-4 text-primary" />
                    {route.data.stops.filter((s) => s.status === "done").length}/{route.data.stops.length} done
                    {route.data.totalMiles > 0 && <span className="text-muted-foreground font-normal">· {route.data.totalMiles.toFixed(1)} mi</span>}
                  </div>
                  <div className="flex gap-1.5">
                    {navigateAllUrl(route.data.stops) && (
                      <a href={navigateAllUrl(route.data.stops)!} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline"><Navigation className="w-3.5 h-3.5 mr-1" />Navigate all</Button>
                      </a>
                    )}
                    <Button size="sm" variant="outline" title="Clear today's route" onClick={() => { if (confirm("Clear today's route?")) clearRoute.mutate(); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-2">
                  {route.data.stops.map((s, i) => (
                    <Card key={s.businessId} className={`p-3 ${s.status !== "pending" ? "opacity-70" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className={`mt-0.5 w-6 h-6 shrink-0 rounded-full text-[11px] font-bold flex items-center justify-center ${
                            s.status === "done" ? "bg-emerald-600 text-white" : s.status === "skipped" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                          }`}>
                            {s.status === "done" ? <Check className="w-3.5 h-3.5" /> : i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className={`font-semibold text-sm truncate ${s.status === "skipped" ? "line-through text-muted-foreground" : "text-foreground"}`}>{s.name ?? "(unnamed)"}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {[s.address, s.city].filter(Boolean).join(" · ") || "—"}
                              {s.distanceFromPrevMiles != null && <> · +{s.distanceFromPrevMiles.toFixed(1)} mi</>}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {s.status === "pending" ? (
                            <>
                              <a href={directionsUrl(s)} target="_blank" rel="noreferrer">
                                <Button size="sm" variant="outline" title="Directions"><Navigation className="w-3.5 h-3.5" /></Button>
                              </a>
                              {canShare && (
                                <Button size="sm" variant="outline" title="Claim QR" onClick={() => setQrFor({ businessId: s.businessId, name: s.name })}>
                                  <QrCode className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button size="sm" variant={openVisitFor === s.businessId ? "secondary" : "default"} onClick={() => setOpenVisitFor(openVisitFor === s.businessId ? null : s.businessId)}>
                                <ClipboardCheck className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" title="Skip" onClick={() => setStopStatus.mutate({ businessId: s.businessId, status: "skipped" })}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" title="Back to pending" onClick={() => setStopStatus.mutate({ businessId: s.businessId, status: "pending" })}>
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {openVisitFor === s.businessId && s.status === "pending" && (
                        <VisitForm businessId={s.businessId} businessName={s.name ?? "business"} onDone={() => setOpenVisitFor(null)} />
                      )}
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Pipeline tab ── */}
        {tab === "pipeline" && (
          <>
            {followupsNeeded.length > 0 && (
              <Card className="mt-5 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><ClipboardList className="w-4 h-4 text-primary" /> Needs a follow-up</div>
                <div className="flex flex-col divide-y divide-border/60">
                  {followupsNeeded.map((v) => (
                    <div key={v.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{v.businessName ?? "(unnamed)"}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {[
                            v.ownerNameForFollowup && `ask for ${v.ownerNameForFollowup}`,
                            v.bestTimeToReturn && `best: ${v.bestTimeToReturn}`,
                            v.ownerEmailCaptured,
                          ].filter(Boolean).join(" · ") || OUTCOMES.find((o) => o.value === v.outcome)?.label}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {canShare && (
                          <Button size="sm" variant="outline" onClick={() => setQrFor({ businessId: v.businessId, name: v.businessName })}>
                            <QrCode className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button size="sm" variant={openVisitFor === v.businessId ? "secondary" : "default"} onClick={() => setOpenVisitFor(openVisitFor === v.businessId ? null : v.businessId)}>
                          <ClipboardCheck className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {openVisitFor && followupsNeeded.some((v) => v.businessId === openVisitFor) && (
                  <VisitForm
                    businessId={openVisitFor}
                    businessName={followupsNeeded.find((v) => v.businessId === openVisitFor)?.businessName ?? "business"}
                    onDone={() => setOpenVisitFor(null)}
                  />
                )}
              </Card>
            )}

            {(myVisits.data?.length ?? 0) > 0 ? (
              <Card className="mt-5 p-4">
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
            ) : (
              !myVisits.isLoading && <p className="text-sm text-muted-foreground py-8 text-center">No visits yet — your day in the field starts on the Targets tab.</p>
            )}

            <Card className="mt-5 p-4">
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
          </>
        )}

        {/* ── Earnings tab ── */}
        {tab === "earnings" && (
          <>
            <Card className="mt-5 p-4">
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

            <Card className="mt-4 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><BadgeCheck className="w-4 h-4 text-primary" /> Your claims</div>
              {myClaims.isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
              {myClaims.data?.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No claims yet — show a business owner your QR code to start one.</p>
              )}
              <div className="flex flex-col divide-y divide-border/60">
                {myClaims.data?.map((c) => {
                  const style = CLAIM_STATE_STYLE[c.state] ?? CLAIM_STATE_STYLE.logged;
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-2 py-2">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{c.businessName ?? "(unnamed)"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString()}
                          {c.state === "verified" && c.bountyAmountCents != null && <> · {dollars(c.bountyAmountCents)}</>}
                          {c.state === "paid" && c.bountyAmountCents != null && <> · {dollars(c.bountyAmountCents)} paid</>}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-1 ${style.cls}`}>{style.label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* ── Bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border">
        <div className="mx-auto max-w-md grid grid-cols-4">
          {([
            { key: "targets", label: "Targets", Icon: MapPin },
            { key: "route", label: "Route", Icon: RouteIcon },
            { key: "pipeline", label: "Pipeline", Icon: ClipboardList },
            { key: "earnings", label: "Earnings", Icon: DollarSign },
          ] as { key: Tab; label: string; Icon: typeof MapPin }[]).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setOpenVisitFor(null); }}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                tab === key ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {qrFor && canShare && (
        <ClaimQrModal base={base!} code={code!} business={qrFor} onClose={() => setQrFor(null)} />
      )}
    </div>
  );
}
