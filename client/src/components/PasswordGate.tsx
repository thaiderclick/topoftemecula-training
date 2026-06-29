import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface PasswordGateProps {
  onSuccess: () => void;
}

export function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    if (!password) {
      toast.error('Please enter the training password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { error?: string }).error ?? 'Incorrect password. Please try again.');
        return;
      }

      await utils.auth.me.invalidate();
      onSuccess();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(160deg, oklch(0.82 0.032 72) 0%, oklch(0.965 0.012 80) 55%, oklch(0.94 0.018 78) 100%)',
      }}
    >
      {/* Decorative wave at bottom */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none overflow-hidden h-32 opacity-30">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z"
            fill="oklch(0.68 0.148 72)"
          />
        </svg>
      </div>

      <div className="max-w-md w-full flex flex-col items-center gap-8 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo.webp"
            alt="Top of Temecula"
            className="w-64 h-auto drop-shadow-md"
          />
          <div className="text-center">
            <p className="tot-eyebrow mb-1">Ambassador Training Portal</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="w-full rounded-2xl p-7 shadow-xl"
          style={{
            background: 'oklch(0.99 0.006 80)',
            border: '1px solid oklch(0.87 0.018 78)',
          }}
        >
          <h2 className="text-lg font-serif font-bold text-foreground mb-5">Sign In to Start Training</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                Your Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your first and last name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                disabled={loading}
                className="rounded-xl bg-background border-border focus-visible:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                Training Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your training access code"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  className="rounded-xl pr-10 bg-background border-border focus-visible:ring-primary"
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
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-5 font-bold gap-2 mt-2 text-sm tracking-wide transition-all active:scale-[0.98]"
              style={{
                background: 'oklch(0.68 0.148 72)',
                color: 'oklch(0.99 0.006 80)',
              }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : <><LogIn className="w-4 h-4" /> Start Training</>
              }
            </Button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Don't have an access code?{' '}
          <span className="font-semibold" style={{ color: 'oklch(0.50 0.12 72)' }}>
            Contact your training coordinator to get started.
          </span>
        </p>
      </div>
    </div>
  );
}
