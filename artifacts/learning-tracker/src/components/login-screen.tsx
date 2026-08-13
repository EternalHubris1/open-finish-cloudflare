import { useState } from 'react';
import { LockKeyhole, LogIn, ShieldAlert } from 'lucide-react';
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080a] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(220,38,38,0.15),transparent_38%),linear-gradient(135deg,#08080a,#171724_55%,#08080a)]" />
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-black/60 p-7 shadow-2xl backdrop-blur-2xl sm:p-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-400">Private workspace</p>
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
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white focus-visible:ring-red-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-[10px] font-bold uppercase tracking-widest text-white/40">Password</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white focus-visible:ring-red-500"
                required
                autoFocus
              />
            </div>

            {error && (
              <p role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full gap-2 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-800 font-bold text-white"
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
