import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, ShieldX, Loader2 } from "lucide-react";
import { Link, useParams } from "wouter";

export default function Verify() {
  const params = useParams();
  const code = (params.code ?? "").trim();

  const verifyQuery = trpc.credential.verify.useQuery(
    { code },
    { enabled: code.length >= 3, retry: false },
  );

  const isLoading = verifyQuery.isLoading && code.length >= 3;
  const result = verifyQuery.data;
  const valid = result?.valid === true;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg border border-border bg-card/90 shadow-xl p-8 text-center">
        <p className="text-xs text-primary font-semibold tracking-[0.2em] uppercase mb-1">Top of Temecula</p>
        <h1 className="text-xl font-serif font-extrabold text-foreground mb-6">Credential Verification</h1>

        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Checking credential…</p>
          </div>
        )}

        {!isLoading && valid && result && (
          <div className="flex flex-col items-center">
            <BadgeCheck className="w-16 h-16 text-emerald-500 mb-4" />
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-6">Valid Credential</p>
            <div className="w-full bg-background/50 rounded-2xl p-6 border border-border shadow-inner text-left flex flex-col gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Issued to</p>
                <p className="text-lg font-serif font-bold text-foreground">{result.holderName ?? "Credential holder"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Certification</p>
                <p className="text-sm font-semibold text-foreground">{result.program}</p>
              </div>
              <div className="flex justify-between gap-3 pt-2 border-t border-border/60">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Credential ID</p>
                  <p className="text-xs font-mono font-bold text-foreground">{result.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Issued</p>
                  <p className="text-xs text-foreground">{new Date(result.issuedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !valid && (
          <div className="flex flex-col items-center py-4">
            <ShieldX className="w-16 h-16 text-rose-500 mb-4" />
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">No Matching Credential</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              We couldn't verify a credential with the ID{code ? <> <span className="font-mono font-semibold text-foreground">{code}</span></> : ""}. Check the ID and try again.
            </p>
          </div>
        )}

        <Link href="/">
          <Button variant="outline" className="mt-8 border-primary text-primary hover:bg-primary/10 rounded-xl px-6 py-5 font-semibold">
            Go to Top of Temecula Training
          </Button>
        </Link>
      </Card>
    </div>
  );
}
