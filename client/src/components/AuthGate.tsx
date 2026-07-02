import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn, Loader2, UserPlus, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface AuthGateProps {
  onSuccess: () => void;
}

type Mode = 'signin' | 'register' | 'forgot' | 'reset';

async function post(path: string, body: Record<string, string>): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (res.ok) return { ok: true };
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return { ok: false, error: data.error };
}

export function AuthGate({ onSuccess }: AuthGateProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();

  const finish = async () => {
    await utils.auth.me.invalidate();
    await utils.credential.mine.invalidate();
    onSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email.');

    setLoading(true);
    try {
      if (mode === 'signin') {
        if (!password) return toast.error('Please enter your password.');
        const r = await post('/api/auth/login', { email: email.trim(), password });
        if (!r.ok) return toast.error(r.error ?? 'Sign-in failed.');
        await finish();
      } else if (mode === 'register') {
        if (!firstName.trim() || !lastName.trim()) return toast.error('Please enter your first and last name.');
        if (!enrollmentCode) return toast.error('Please enter your enrollment code.');
        if (password.length < 8) return toast.error('Password must be at least 8 characters.');
        const r = await post('/api/auth/register', {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          enrollmentCode,
        });
        if (!r.ok) return toast.error(r.error ?? 'Registration failed.');
        toast.success('Welcome aboard!');
        await finish();
      } else if (mode === 'forgot') {
        const r = await post('/api/auth/forgot', { email: email.trim() });
        if (!r.ok) return toast.error(r.error ?? 'Could not send the code.');
        toast.success('If that email has an account, a 6-digit code is on its way.');
        setMode('reset');
      } else {
        if (!resetCode.trim()) return toast.error('Enter the 6-digit code from your email.');
        if (password.length < 8) return toast.error('New password must be at least 8 characters.');
        const r = await post('/api/auth/reset', { email: email.trim(), code: resetCode.trim(), newPassword: password });
        if (!r.ok) return toast.error(r.error ?? 'Reset failed.');
        toast.success('Password updated — sign in with it now.');
        setPassword('');
        setMode('signin');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const heading =
    mode === 'signin' ? 'Sign In' :
    mode === 'register' ? 'Create Your Account' :
    mode === 'forgot' ? 'Reset Your Password' :
    'Enter Your Reset Code';

  const submitLabel =
    mode === 'signin' ? <><LogIn className="w-4 h-4" /> Sign In</> :
    mode === 'register' ? <><UserPlus className="w-4 h-4" /> Create Account</> :
    mode === 'forgot' ? <><KeyRound className="w-4 h-4" /> Email Me a Code</> :
    <><KeyRound className="w-4 h-4" /> Set New Password</>;

  const inputClass = 'rounded-xl bg-background border-border focus-visible:ring-primary';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(160deg, oklch(0.82 0.032 72) 0%, oklch(0.965 0.012 80) 55%, oklch(0.94 0.018 78) 100%)',
      }}
    >
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none overflow-hidden h-32 opacity-30">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z" fill="oklch(0.68 0.148 72)" />
        </svg>
      </div>

      <div className="max-w-md w-full flex flex-col items-center gap-8 relative z-10">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-dark.png" alt="Top of Temecula" className="w-64 h-auto" />
          <div className="text-center">
            <p className="tot-eyebrow mb-1">Ambassador Portal</p>
          </div>
        </div>

        <div
          className="w-full rounded-2xl p-7 shadow-xl"
          style={{ background: 'oklch(0.99 0.006 80)', border: '1px solid oklch(0.87 0.018 78)' }}
        >
          <h2 className="text-lg font-serif font-bold text-foreground mb-5">{heading}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-foreground">First name</Label>
                  <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)}
                    autoComplete="given-name" disabled={loading} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-foreground">Last name</Label>
                  <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)}
                    autoComplete="family-name" disabled={loading} className={inputClass} />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} autoComplete="email" disabled={loading || mode === 'reset'}
                className={inputClass} />
            </div>

            {mode === 'reset' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="resetCode" className="text-sm font-semibold text-foreground">6-digit code</Label>
                <Input id="resetCode" inputMode="numeric" placeholder="123456" value={resetCode}
                  onChange={e => setResetCode(e.target.value)} disabled={loading}
                  className={`${inputClass} tracking-[0.4em] font-mono`} />
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                  {mode === 'reset' ? 'New password' : 'Password'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'signin' ? 'Your password' : 'At least 8 characters'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    disabled={loading}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signin' && (
                  <button type="button" onClick={() => setMode('forgot')}
                    className="text-[11px] text-primary hover:underline font-semibold self-end">
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="enrollmentCode" className="text-sm font-semibold text-foreground">Enrollment code</Label>
                <Input id="enrollmentCode" placeholder="From your training coordinator" value={enrollmentCode}
                  onChange={e => setEnrollmentCode(e.target.value)} disabled={loading} className={inputClass} />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-5 font-bold gap-2 mt-2 text-sm tracking-wide transition-all active:scale-[0.98]"
              style={{ background: 'oklch(0.68 0.148 72)', color: 'oklch(0.99 0.006 80)' }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Working…</> : submitLabel}
            </Button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {mode === 'signin' ? (
            <>New ambassador?{' '}
              <button onClick={() => setMode('register')} className="font-semibold hover:underline" style={{ color: 'oklch(0.50 0.12 72)' }}>
                Create your account
              </button>
              {' '}with the enrollment code from your coordinator.
            </>
          ) : mode === 'register' ? (
            <>Already have an account?{' '}
              <button onClick={() => setMode('signin')} className="font-semibold hover:underline" style={{ color: 'oklch(0.50 0.12 72)' }}>
                Sign in
              </button>
            </>
          ) : (
            <>Remembered it?{' '}
              <button onClick={() => setMode('signin')} className="font-semibold hover:underline" style={{ color: 'oklch(0.50 0.12 72)' }}>
                Back to sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
