import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AppSidebar } from '@/components/app-sidebar';
import Dashboard from '@/pages/dashboard-v2';
import Activities from '@/pages/activities';
import ActivityDetail from '@/pages/activity-detail';
import History from '@/pages/history';
import Achievements from '@/pages/achievements';
import Alerts from '@/pages/alerts';
import Profile from '@/pages/profile';
import Streaks from '@/pages/streaks';
import DashboardExploration from '@/pages/dashboard-exploration';
import NotFound from '@/pages/not-found';
import musashi from '@assets/musashi_1785336444855.jpg';
import { LoginScreen } from '@/components/login-screen';
import { Skeleton } from '@/components/ui/skeleton';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function Router({ onLogout }: { onLogout: () => Promise<void> }) {
  return (
    <div className="flex min-h-screen relative overflow-hidden bg-[#080b10]">
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 78% 12%, rgba(46,55,72,.48), transparent 34%), linear-gradient(135deg, #080b10 0%, #0d1119 48%, #090c12 100%)' }} />

      {/* Prominent Musashi background */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-[55%] pointer-events-none z-0"
        style={{
          backgroundImage: `url(${musashi})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,.52) 0%, rgba(0,0,0,.14) 54%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,.52) 0%, rgba(0,0,0,.14) 54%, transparent 100%)',
          filter: 'grayscale(1) contrast(1.08)',
          opacity: 0.32,
          mixBlendMode: 'luminosity'
        }}
      />

      <div className="fixed top-[9%] left-[16%] h-[380px] w-[380px] rounded-full bg-[#ff6b5f] blur-[150px] opacity-[0.045] pointer-events-none z-0" />
      <div className="fixed bottom-[2%] right-[8%] h-[420px] w-[420px] rounded-full bg-[#ffc268] blur-[170px] opacity-[0.035] pointer-events-none z-0" />

      <div className="fixed top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#ff7a68]/45 to-transparent z-50 pointer-events-none" />

      <AppSidebar onLogout={onLogout} />
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden relative z-10 h-screen">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/activities" component={Activities} />
          <Route path="/activities/:id" component={ActivityDetail} />
          <Route path="/history" component={History} />
          <Route path="/streaks" component={Streaks} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/profile" component={Profile} />
          <Route path="/explore/dashboard-a">{() => <DashboardExploration concept="a" />}</Route>
          <Route path="/explore/dashboard-b">{() => <DashboardExploration concept="b" />}</Route>
          <Route path="/explore/dashboard-c">{() => <DashboardExploration concept="c" />}</Route>
          <Route path="/explore/dashboard-d">{() => <DashboardExploration concept="d" />}</Route>
          <Route path="/explore/dashboard-e">{() => <DashboardExploration concept="e" />}</Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function AuthGate() {
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'anonymous'>('checking');
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session')
      .then(async (response) => {
        if (!response.ok) throw new Error('Session check failed');
        return response.json() as Promise<{ authenticated: boolean; configured: boolean }>;
      })
      .then((session) => {
        if (!active) return;
        setConfigured(session.configured);
        setStatus(session.authenticated ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (active) setStatus('anonymous');
      });

    const handleUnauthorized = () => {
      queryClient.clear();
      setStatus('anonymous');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    queryClient.clear();
    setStatus('anonymous');
  };

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080a]">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-14 w-14 rounded-2xl bg-white/5" />
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/30">Checking access</p>
        </div>
      </div>
    );
  }

  if (status === 'anonymous') {
    return <LoginScreen configured={configured} onAuthenticated={() => setStatus('authenticated')} />;
  }

  return <Router onLogout={logout} />;
}

function App() {
  const isLocalPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview');
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          {isLocalPreview ? <Router onLogout={async () => undefined} /> : <AuthGate />}
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
