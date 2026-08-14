import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, LogIn, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginScreenProps {
  configured: boolean;
  onAuthenticated: () => void;
}

export function LoginScreen({ configured, onAuthenticated }: LoginScreenProps) {
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;

      if (!response.ok) {
        setError(body?.error || 'Could not sign in. Check the connection and try again.');
        return;
      }

      setPassword('');
      onAuthenticated();
    } catch {
      setError('Could not reach the server. Check the connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b10] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_18%,rgba(255,111,97,0.09),transparent_34%),linear-gradient(135deg,#080b10,#0d1119_55%,#090c12)]" />
      <div className="signal-surface relative w-full max-w-md rounded-[2rem] border border-white/[.08] bg-[#0c1119]/94 p-7 shadow-2xl sm:p-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ff7868]/25 bg-[#ff7868]/[.07] text-[#ff8b7c]">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff8b7c]">Private workspace</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Welcome back</h1>
          </div>
        </div>

        {!configured ? (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-sm text-amber-100">
            <div className="mb-2 flex items-center gap-2 font-bold">
              <ShieldAlert className="h-4 w-4" /> Access is not configured
            </div>
            Add the <code className="rounded bg-black/30 px-1.5 py-0.5">ADMIN_PASSWORD</code> secret in Replit, then redeploy.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-username" className="text-[10px] font-bold uppercase tracking-widest text-white/40">Login</Label>
              <Input
                id="login-username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white focus-visible:ring-[#ff7868]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-[10px] font-bold uppercase tracking-widest text-white/40">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`h-12 rounded-2xl border-white/10 bg-white/5 pr-12 focus-visible:ring-[#ff7868] ${passwordVisible ? 'text-white' : 'password-cross-input text-transparent'}`}
                  aria-describedby="password-mask-note"
                  required
                  autoFocus
                />
                {!passwordVisible && password.length > 0 && <span aria-hidden="true" className="password-cross-mask">{Array.from(password, () => '×').join(' ')}</span>}
                <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/35 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7868]">{passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              <p id="password-mask-note" className="sr-only">The password is visually represented by crosses while hidden.</p>
            </div>

            {error && (
              <p role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="signal-button h-12 w-full gap-2 rounded-2xl bg-[#e95448] font-bold text-white hover:bg-[#f26456]"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
