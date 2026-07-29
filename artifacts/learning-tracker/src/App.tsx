import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AppSidebar } from '@/components/app-sidebar';
import Dashboard from '@/pages/dashboard';
import Activities from '@/pages/activities';
import ActivityDetail from '@/pages/activity-detail';
import Achievements from '@/pages/achievements';
import Alerts from '@/pages/alerts';
import Profile from '@/pages/profile';
import NotFound from '@/pages/not-found';
import musashi from '@assets/musashi_1785336444855.jpg';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <div className="flex min-h-screen relative">
      {/* Fixed Musashi background decoration */}
      <div 
        className="fixed right-0 bottom-0 w-[480px] h-[640px] pointer-events-none z-0"
        style={{
          backgroundImage: `url(${musashi})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.28) 50%, transparent 100%), linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 35%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.28) 50%, transparent 100%), linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 35%)',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
          filter: 'contrast(1.15) saturate(0.9)',
          opacity: 0.38,
          mixBlendMode: 'screen'
        }}
      />

      {/* Ambient glow orbs */}
      <div className="fixed top-[-80px] left-[10%] w-[400px] h-[400px] rounded-full bg-blue-500 blur-3xl opacity-10 pointer-events-none z-0 animate-pulse-glow" style={{ animationDelay: '0s' }} />
      <div className="fixed top-[30%] right-[5%] w-[300px] h-[300px] rounded-full bg-cyan-500 blur-3xl opacity-[0.08] pointer-events-none z-0 animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="fixed bottom-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-blue-700 blur-3xl opacity-[0.06] pointer-events-none z-0 animate-pulse-glow" style={{ animationDelay: '3s' }} />

      <AppSidebar />
      <main className="flex-1 overflow-x-hidden relative z-10">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/activities" component={Activities} />
          <Route path="/activities/:id" component={ActivityDetail} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
