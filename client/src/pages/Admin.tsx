import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Users, Award, Shield, Zap, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

type Trainee = {
  id: number;
  name: string | null;
  openId: string;
  createdAt: Date;
  lastSignedIn: Date;
  progress: {
    completedModules: string[];
    completedAssignments: string[];
    safetyCompleted: boolean;
    passedFinalTest: boolean;
    finalTestScore: number | null;
    assignmentsData: Record<string, string>;
    shift1DebriefData: Record<string, string> | null;
  } | null;
  roleplayAttempts: number;
  roleplayPasses: number;
};

// ─── Progress helpers ─────────────────────────────────────────────────────────

function calcOverallProgress(trainee: Trainee): number {
  const p = trainee.progress;
  if (!p) return 0;
  let score = 0;
  if (p.completedModules.includes("day1")) score += 25;
  if (p.completedModules.includes("day2")) score += 25;
  if (p.completedModules.includes("day3")) score += 20;
  if (p.safetyCompleted) score += 10;
  if (p.passedFinalTest) score += 20;
  return score;
};

function ProgressBar({ value }: { value: number }) {
  const color = value === 100 ? "bg-green-500" : value >= 50 ? "bg-amber-500" : "bg-slate-400";
  return (
    <div className="w-full bg-slate-200 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${value}%` }} />
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return ok
    ? <Badge className="bg-green-100 text-green-800 border-green-200 gap-1"><CheckCircle className="w-3 h-3" />{label}</Badge>
    : <Badge variant="outline" className="text-slate-400 gap-1"><Clock className="w-3 h-3" />{label}</Badge>;
}

// ─── Trainee row (expandable) ─────────────────────────────────────────────────

function TraineeRow({ trainee }: { trainee: Trainee }) {
  const [open, setOpen] = useState(false);
  const pct = calcOverallProgress(trainee);
  const p = trainee.progress;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-3 shadow-sm">
      {/* Summary row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: pct === 100 ? "#22c55e" : "oklch(0.22 0.01 65)" }}>
          {(trainee.name ?? "?").charAt(0).toUpperCase()}
        </div>

        {/* Name + date */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{trainee.name ?? "Unknown"}</p>
          <p className="text-xs text-slate-400">Joined {new Date(trainee.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Progress bar */}
        <div className="w-32 hidden sm:block">
          <ProgressBar value={pct} />
          <p className="text-xs text-slate-500 mt-1 text-right">{pct}%</p>
        </div>

        {/* Status badges */}
        <div className="flex gap-2 flex-wrap justify-end">
          {p?.passedFinalTest
            ? <Badge className="bg-green-600 text-white gap-1"><Award className="w-3 h-3" />Cleared</Badge>
            : <Badge variant="outline" className="text-slate-400">In Progress</Badge>
          }
        </div>

        {/* Expand icon */}
        <div className="text-slate-400 flex-shrink-0">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Module progress */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Training Modules</p>
            <div className="flex flex-col gap-2">
              <StatusBadge ok={!!p?.completedModules.includes("day1")} label="Day 1 Complete" />
              <StatusBadge ok={!!p?.completedModules.includes("day2")} label="Day 2 Complete" />
              <StatusBadge ok={!!p?.completedModules.includes("day3")} label="Day 3 Complete" />
              <StatusBadge ok={!!p?.safetyCompleted} label="Safety Scenarios" />
              <StatusBadge ok={!!p?.passedFinalTest} label={`Final Test${p?.finalTestScore != null ? ` (${p.finalTestScore}/10)` : ""}`} />
            </div>
          </div>

          {/* Roleplay + Assignments */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Roleplay & Assignments</p>
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>{trainee.roleplayAttempts} roleplay attempt{trainee.roleplayAttempts !== 1 ? "s" : ""}, {trainee.roleplayPasses} pass{trainee.roleplayPasses !== 1 ? "es" : ""}</span>
              </div>
            </div>

            {p?.assignmentsData && Object.keys(p.assignmentsData).length > 0 && (
              <>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Submitted Assignments</p>
                <div className="flex flex-col gap-2">
                  {Object.entries(p.assignmentsData).map(([key, val]) => (
                    <div key={key} className="bg-white rounded-lg border border-slate-200 p-3">
                      <p className="text-xs font-medium text-slate-500 mb-1 capitalize">{key.replace(/_/g, " ")}</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{val}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {p?.shift1DebriefData && Object.keys(p.shift1DebriefData).length > 0 && (
              <>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4 mb-2">Shift 1 Debrief</p>
                <div className="flex flex-col gap-2">
                  {Object.entries(p.shift1DebriefData).map(([key, val]) => (
                    <div key={key} className="bg-white rounded-lg border border-slate-200 p-3">
                      <p className="text-xs font-medium text-slate-500 mb-1 capitalize">{key.replace(/_/g, " ")}</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{val}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Login Gate ─────────────────────────────────────────────────────────

function AdminLoginGate({ onAuth }: { onAuth: (pwd: string) => void }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.admin.login.useMutation({
    onSuccess: () => onAuth(pwd),
    onError: () => setError("Incorrect password. Please try again."),
  });

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.97 0.01 72)" }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "oklch(0.22 0.01 65)" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-slate-800 text-lg">Supervisor Access</h1>
            <p className="text-xs text-slate-500">Top of Temecula Training</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Enter supervisor password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && loginMutation.mutate({ password: pwd })}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            onClick={() => loginMutation.mutate({ password: pwd })}
            disabled={!pwd || loginMutation.isPending}
            className="w-full font-semibold"
            style={{ background: "oklch(0.22 0.01 65)", color: "white" }}
          >
            {loginMutation.isPending ? "Verifying..." : "Access Dashboard"}
          </Button>
          <Link href="/" className="text-center text-xs text-slate-400 hover:text-slate-600 transition-colors">
            ← Back to Training Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Admin() {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);

  const { data: trainees, isLoading, error } = trpc.admin.getTrainees.useQuery(
    { adminPassword: adminPassword ?? "" },
    { enabled: !!adminPassword }
  );

  if (!adminPassword) {
    return <AdminLoginGate onAuth={setAdminPassword} />;
  }

  const cleared = (trainees ?? []).filter(t => t.progress?.passedFinalTest).length;
  const inProgress = (trainees ?? []).filter(t => !t.progress?.passedFinalTest && t.progress !== null).length;

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.01 72)" }}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo-dark.png" alt="Top of Temecula" className="h-8 w-auto" />
          <div>
            <h1 className="font-serif font-bold text-slate-800 text-lg">Supervisor Dashboard</h1>
            <p className="text-xs text-slate-500">Ambassador Training Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 text-slate-600">
              <LogOut className="w-4 h-4" /> Exit
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Trainees", value: trainees?.length ?? "—", color: "text-slate-700" },
            { icon: Award, label: "Cleared for Field", value: cleared, color: "text-green-600" },
            { icon: Clock, label: "In Progress", value: inProgress, color: "text-amber-600" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
              <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Trainee list */}
        <div>
          <h2 className="font-serif font-bold text-slate-800 text-xl mb-4">All Trainees</h2>

          {isLoading && (
            <div className="text-center py-12 text-slate-400">Loading trainee data...</div>
          )}

          {error && (
            <div className="text-center py-12 text-red-500">
              {error.message === "Unauthorized" ? "Incorrect password." : "Failed to load data. Please refresh."}
            </div>
          )}

          {!isLoading && !error && (trainees ?? []).length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No trainees yet</p>
              <p className="text-slate-400 text-sm mt-1">Trainees will appear here once they log in and start training.</p>
            </div>
          )}

          {(trainees ?? []).map(t => (
            <TraineeRow key={t.id} trainee={t as Trainee} />
          ))}
        </div>
      </div>
    </div>
  );
}
