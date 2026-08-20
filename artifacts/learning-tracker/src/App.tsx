import {
  Component,
  FormEvent,
  lazy,
  Suspense,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AlertTriangle, LockKeyhole, LoaderCircle } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import { AppSidebar } from "@/components/app-sidebar";
import musashi from "@assets/musashi_1785336444855.jpg";

const Dashboard = lazy(() => import("@/pages/dashboard-v2"));
const Activities = lazy(() => import("@/pages/activities"));
const ActivityDetail = lazy(() => import("@/pages/activity-detail"));
const History = lazy(() => import("@/pages/history"));
const Reflections = lazy(() => import("@/pages/reflections"));
const Achievements = lazy(() => import("@/pages/achievements"));
const Alerts = lazy(() => import("@/pages/alerts"));
const Profile = lazy(() => import("@/pages/profile"));
const Streaks = lazy(() => import("@/pages/streaks"));
const DashboardExploration = lazy(
  () => import("@/pages/dashboard-exploration"),
);
const NotFound = lazy(() => import("@/pages/not-found"));

type SessionStatus = {
  passwordEnabled: boolean;
  authenticated: boolean;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function LoginScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Password could not be verified");
      }
      setPassword("");
      onAuthenticated();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Password could not be verified",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#080b10] p-5 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_16%,rgba(255,111,97,.12),transparent_24%),radial-gradient(circle_at_25%_82%,rgba(255,194,104,.07),transparent_28%),linear-gradient(135deg,#080b10_0%,#0d1119_52%,#080b10_100%)]" />
      <section className="signal-surface relative w-full max-w-md rounded-[2rem] border border-white/[.09] bg-[#0c1119]/92 p-7 shadow-[0_24px_90px_rgba(0,0,0,.38)] md:p-9">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#ff8b7c]/25 bg-[#ff7868]/10 text-[#ffb1a7] shadow-[0_0_30px_rgba(255,111,97,.1)]">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <p className="mt-7 text-[9px] font-bold uppercase tracking-[.24em] text-[#ff9a89]">
          Open Finish · private workspace
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white">
          Continue your line.
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/50">
          Enter the workspace password to view your directions, sessions, and
          notes.
        </p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="sr-only">Workspace password</span>
            <Input
              autoComplete="current-password"
              autoFocus
              className="password-cross-input h-12 rounded-2xl border-white/10 bg-white/[.035] px-4 text-white placeholder:text-white/25"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Workspace password"
              type="password"
              value={password}
            />
          </label>
          {error && (
            <p
              className="rounded-xl border border-[#ff8b7c]/20 bg-[#ff7868]/[.07] px-3 py-2 text-xs leading-5 text-[#ffb1a7]"
              role="alert"
            >
              {error}
            </p>
          )}
          <Button
            className="of-button h-12 w-full rounded-2xl bg-[#e95448] text-[10px] font-bold uppercase tracking-[.16em] text-white hover:bg-[#f26456]"
            disabled={submitting || !password}
            type="submit"
          >
            {submitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            Enter workspace
          </Button>
        </form>
      </section>
    </main>
  );
}

function RouteLoadingFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center p-8" role="status">
      <LoaderCircle
        className="h-6 w-6 animate-spin text-[#ff9a89]"
        aria-label="Loading view"
      />
    </div>
  );
}

type RouteErrorBoundaryProps = {
  children: ReactNode;
  resetKey: string;
};

type RouteErrorBoundaryState = {
  hasError: boolean;
};

class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The public UI intentionally does not expose runtime or API details.
  }

  componentDidUpdate(previousProps: RouteErrorBoundaryProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="mx-auto grid min-h-[60vh] max-w-lg place-items-center p-6 text-center text-white">
          <div className="signal-surface w-full rounded-[2rem] border border-[#ff8b7c]/20 bg-[#0c1119]/92 p-8 shadow-[0_24px_90px_rgba(0,0,0,.26)]">
            <AlertTriangle className="mx-auto h-7 w-7 text-[#ff9a89]" />
            <h1 className="mt-4 text-xl font-semibold">
              This view could not be opened
            </h1>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Return to the dashboard or refresh the page. Your saved activity
              has not been changed.
            </p>
            <a
              className="mt-6 inline-flex h-11 items-center rounded-full bg-[#e95448] px-5 text-[10px] font-bold uppercase tracking-[.14em] text-white transition-colors hover:bg-[#f26456]"
              href="/"
            >
              Return to dashboard
            </a>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

function Router({ onLogout }: { onLogout: () => Promise<void> }) {
  const [location] = useLocation();

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
        <RouteErrorBoundary resetKey={location}>
          <Suspense fallback={<RouteLoadingFallback />}>
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
          </Suspense>
        </RouteErrorBoundary>
      </main>
    </div>
  );
}

function AccessGate() {
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Session endpoint unavailable");
        const session = (await response.json()) as SessionStatus;
        if (active) setStatus(session);
      } catch {
        if (active) setUnavailable(true);
      }
    };
    void loadSession();

    const onUnauthorized = () => {
      queryClient.clear();
      setStatus((current) =>
        current ? { ...current, authenticated: false } : current,
      );
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener("auth:unauthorized", onUnauthorized);
    };
  }, []);

  const authenticate = () => {
    queryClient.clear();
    setStatus({ passwordEnabled: true, authenticated: true });
  };
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    setStatus({ passwordEnabled: true, authenticated: false });
  };

  if (unavailable) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080b10] p-5 text-white">
        <section className="signal-surface w-full max-w-md rounded-[2rem] border border-[#ff8b7c]/20 bg-[#0c1119]/92 p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-[#ff9a89]" />
          <h1 className="mt-4 text-xl font-semibold">
            Workspace is unavailable
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/50">
            The secure session could not be started. Refresh the page or try
            again shortly.
          </p>
        </section>
      </main>
    );
  }

  if (!status) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080b10] text-white">
        <LoaderCircle
          className="h-6 w-6 animate-spin text-[#ff9a89]"
          aria-label="Loading private workspace"
        />
      </main>
    );
  }

  if (status.passwordEnabled && !status.authenticated) {
    return <LoginScreen onAuthenticated={authenticate} />;
  }

  return <Router onLogout={logout} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AccessGate />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
