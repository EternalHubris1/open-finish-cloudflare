import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/dashboard-v2";
import Activities from "@/pages/activities";
import ActivityDetail from "@/pages/activity-detail";
import History from "@/pages/history";
import Reflections from "@/pages/reflections";
import Achievements from "@/pages/achievements";
import Alerts from "@/pages/alerts";
import Profile from "@/pages/profile";
import Streaks from "@/pages/streaks";
import DashboardExploration from "@/pages/dashboard-exploration";
import NotFound from "@/pages/not-found";
import musashi from "@assets/musashi_1785336444855.jpg";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function Router({ onLogout }: { onLogout: () => Promise<void> }) {
  return (
    <div className="flex min-h-screen relative overflow-hidden bg-[#080b10]">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 78% 12%, rgba(46,55,72,.48), transparent 34%), linear-gradient(135deg, #080b10 0%, #0d1119 48%, #090c12 100%)",
        }}
      />

      <div
        className="fixed right-0 top-0 bottom-0 w-[55%] pointer-events-none z-0"
        style={{
          backgroundImage: `url(${musashi})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          maskImage:
            "linear-gradient(to left, rgba(0,0,0,.52) 0%, rgba(0,0,0,.14) 54%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to left, rgba(0,0,0,.52) 0%, rgba(0,0,0,.14) 54%, transparent 100%)",
          filter: "grayscale(1) contrast(1.08)",
          opacity: 0.32,
          mixBlendMode: "luminosity",
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
          <Route path="/reflections" component={Reflections} />
          <Route path="/streaks" component={Streaks} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/profile" component={Profile} />
          <Route path="/explore/dashboard-a">
            {() => <DashboardExploration concept="a" />}
          </Route>
          <Route path="/explore/dashboard-b">
            {() => <DashboardExploration concept="b" />}
          </Route>
          <Route path="/explore/dashboard-c">
            {() => <DashboardExploration concept="c" />}
          </Route>
          <Route path="/explore/dashboard-d">
            {() => <DashboardExploration concept="d" />}
          </Route>
          <Route path="/explore/dashboard-e">
            {() => <DashboardExploration concept="e" />}
          </Route>
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router onLogout={async () => undefined} />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
