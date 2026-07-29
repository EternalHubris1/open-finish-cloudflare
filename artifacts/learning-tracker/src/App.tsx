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
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden">
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
