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
    <div className="flex min-h-screen relative bg-[#0a0a0a] overflow-hidden">
      {/* Background Gradient to ensure full coverage */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 40%, #16161d 70%, #0f0f0f 100%)' }} />

      {/* Prominent Musashi background */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-[55%] pointer-events-none z-0"
        style={{
          backgroundImage: `url(${musashi})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)',
          filter: 'contrast(1.15) saturate(0.85)',
          opacity: 0.9,
          mixBlendMode: 'screen'
        }}
      />

      {/* Ambient glow orbs - red/orange motif */}
      <div className="fixed top-[15%] left-[8%] w-[400px] h-[400px] rounded-full bg-red-600 blur-[120px] opacity-[0.15] pointer-events-none z-0 animate-pulse-glow" style={{ animationDelay: '0s' }} />
      <div className="fixed top-[40%] right-[10%] w-[350px] h-[350px] rounded-full bg-orange-600 blur-[100px] opacity-[0.12] pointer-events-none z-0 animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="fixed bottom-[5%] left-[25%] w-[450px] h-[450px] rounded-full bg-red-900 blur-[120px] opacity-[0.18] pointer-events-none z-0 animate-pulse-glow" style={{ animationDelay: '3s' }} />

      {/* Calligraphy-style red divider lines top/bottom */}
      <div className="fixed top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent z-50 pointer-events-none" />
      <div className="fixed bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent z-50 pointer-events-none" />

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
