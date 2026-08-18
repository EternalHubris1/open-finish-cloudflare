import { useEffect, useState, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Target,
  Award,
  Bell,
  User,
  CalendarDays,
  Flame,
  LogOut,
  MoreHorizontal,
  X,
  BookOpenText,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarRoute = {
  path: string;
  label: string;
  cue: string;
  icon: ComponentType<{ className?: string }>;
};

const orientationRoutes: SidebarRoute[] = [
  { path: "/", label: "Dashboard", cue: "Current signal", icon: Home },
  { path: "/activities", label: "Activities", cue: "Directions", icon: Target },
  {
    path: "/history",
    label: "History",
    cue: "Patterns over time",
    icon: CalendarDays,
  },
  {
    path: "/reflections",
    label: "Reflections",
    cue: "Evidence kept",
    icon: BookOpenText,
  },
];

const longViewRoutes: SidebarRoute[] = [
  { path: "/streaks", label: "Streaks", cue: "Return rhythm", icon: Flame },
  {
    path: "/achievements",
    label: "Achievements",
    cue: "Rare milestones",
    icon: Award,
  },
];

const utilityRoutes: SidebarRoute[] = [
  { path: "/alerts", label: "Alerts", cue: "Gentle reminders", icon: Bell },
  { path: "/profile", label: "Profile", cue: "Personal settings", icon: User },
];

const allRoutes = [...orientationRoutes, ...longViewRoutes, ...utilityRoutes];

function routeIsActive(location: string, path: string) {
  return path === "/"
    ? location === path
    : location === path || location.startsWith(`${path}/`);
}

function DesktopRoute({
  route,
  active,
}: {
  route: SidebarRoute;
  active: boolean;
}) {
  const Icon = route.icon;
  return (
    <Link
      href={route.path}
      aria-current={active ? "page" : undefined}
      className={cn(
        "sidebar-route group relative flex min-h-12 items-center gap-3 overflow-hidden rounded-2xl border px-2.5 py-2",
        active
          ? "border-[#ff8b7c]/20 bg-[linear-gradient(100deg,rgba(255,111,97,.14),rgba(255,194,104,.035)_70%,transparent)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.035),0_12px_30px_rgba(0,0,0,.16)]"
          : "border-transparent text-white/48 hover:border-white/[.06] hover:bg-white/[.04] hover:text-white/85",
      )}
      data-testid={`nav-${route.label.toLowerCase()}`}
    >
      <span
        className={cn(
          "relative grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition-[color,background-color,border-color,box-shadow] duration-200",
          active
            ? "border-[#ff8b7c]/25 bg-[#ff7868]/12 text-[#ff9a89] shadow-[0_0_22px_rgba(255,111,97,.12)]"
            : "border-white/[.055] bg-white/[.025] text-white/38 group-hover:border-white/10 group-hover:bg-white/[.055] group-hover:text-white/75",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold tracking-[-.01em]">
          {route.label}
        </span>
        <span
          className={cn(
            "mt-0.5 block truncate text-[8px] font-bold uppercase tracking-[.15em] transition-colors",
            active
              ? "text-[#ff9a89]/62"
              : "text-white/20 group-hover:text-white/34",
          )}
        >
          {route.cue}
        </span>
      </span>
      <ChevronRight
        className={cn(
          "h-3.5 w-3.5 shrink-0 transition-[opacity,transform,color] duration-200",
          active
            ? "translate-x-0 text-[#ff9a89]/70 opacity-100"
            : "-translate-x-1 text-white/30 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
        )}
      />
      {active && (
        <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-[#ffc268] via-[#ff7868] to-[#ff7868]/20 shadow-[0_0_12px_rgba(255,120,104,.65)]" />
      )}
    </Link>
  );
}

function RouteSection({
  label,
  routes,
  location,
}: {
  label: string;
  routes: SidebarRoute[];
  location: string;
}) {
  const sectionId = `sidebar-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <section aria-labelledby={sectionId}>
      <p
        id={sectionId}
        className="mb-2 px-3 text-[8px] font-bold uppercase tracking-[.24em] text-white/20"
      >
        {label}
      </p>
      <div className="space-y-1">
        {routes.map((route) => (
          <DesktopRoute
            key={route.path}
            route={route}
            active={routeIsActive(location, route.path)}
          />
        ))}
      </div>
    </section>
  );
}

export function AppSidebar({ onLogout }: { onLogout: () => Promise<void> }) {
  const [location] = useLocation();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const mobilePrimaryRoutes = orientationRoutes;
  const mobileMoreRoutes = [...longViewRoutes, ...utilityRoutes];
  const currentRoute =
    allRoutes.find((route) => routeIsActive(location, route.path)) ??
    orientationRoutes[0];

  useEffect(() => setMobileMoreOpen(false), [location]);

  return (
    <>
      <aside className="sidebar-shell relative z-20 hidden h-dvh w-[17rem] shrink-0 flex-col overflow-hidden border-r border-white/[.07] md:flex">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_30%_0%,rgba(255,111,97,.12),transparent_62%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#ff7868]/18 to-transparent" />

        <header className="relative border-b border-white/[.055] px-5 py-5">
          <div className="flex items-center gap-3.5">
            <div className="sidebar-emblem relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#ff7868]/28 bg-[#ff7868]/[.055] shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_0_26px_rgba(255,111,97,.09)]">
              <span
                className="text-lg font-bold text-[#ff8b7c]"
                style={{ fontFamily: "serif" }}
              >
                道
              </span>
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[#070a0f] bg-[#ffc268] shadow-[0_0_10px_rgba(255,194,104,.75)]" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold tracking-[-.02em] text-white">
                Open Finish
              </h1>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[.22em] text-[#ff9a89]/60">
                Personal OS · live line
              </p>
            </div>
          </div>
        </header>

        <nav className="relative flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
          <RouteSection
            label="Orientation"
            routes={orientationRoutes}
            location={location}
          />
          <RouteSection
            label="Long view"
            routes={longViewRoutes}
            location={location}
          />
          <div className="mt-auto pt-2">
            <RouteSection
              label="System"
              routes={utilityRoutes}
              location={location}
            />
          </div>
        </nav>

        <footer className="relative border-t border-white/[.055] p-3">
          <div className="mb-2 rounded-2xl border border-white/[.055] bg-white/[.025] px-3 py-2.5">
            <p className="text-[8px] font-bold uppercase tracking-[.2em] text-white/20">
              In view
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white/70">
                  {currentRoute.label}
                </p>
                <p className="mt-0.5 truncate text-[9px] text-white/28">
                  {currentRoute.cue}
                </p>
              </div>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff8b7c] shadow-[0_0_9px_rgba(255,120,104,.7)]" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="sidebar-route flex w-full items-center justify-center gap-2 rounded-xl border border-transparent px-3 py-2 text-[9px] font-bold uppercase tracking-[.16em] text-white/24 hover:border-white/[.055] hover:bg-white/[.035] hover:text-white/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8b7c]/70"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </footer>
      </aside>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/10 bg-[#070a0f]/94 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_50px_rgba(0,0,0,.28)] backdrop-blur-2xl md:hidden"
        aria-label="Primary navigation"
      >
        {mobilePrimaryRoutes.map((route) => {
          const Icon = route.icon;
          const active = routeIsActive(location, route.path);
          return (
            <Link
              key={route.path}
              href={route.path}
              aria-current={active ? "page" : undefined}
              className={cn(
                "sidebar-route relative flex min-w-0 flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[8px] font-bold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8b7c]/70",
                active
                  ? "border-[#ff7868]/14 bg-[#ff7868]/10 text-[#ff9a89]"
                  : "border-transparent text-white/32",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{route.label}</span>
              {active && (
                <span className="absolute top-0 h-0.5 w-5 rounded-full bg-[#ff8b7c]" />
              )}
            </Link>
          );
        })}
        <button
          type="button"
          aria-expanded={mobileMoreOpen}
          aria-label={
            mobileMoreOpen ? "Close more navigation" : "Open more navigation"
          }
          onClick={() => setMobileMoreOpen((open) => !open)}
          className={cn(
            "sidebar-route relative flex min-w-0 flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[8px] font-bold uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8b7c]/70",
            mobileMoreOpen
              ? "border-[#ff7868]/14 bg-[#ff7868]/10 text-[#ff9a89]"
              : "border-transparent text-white/32",
          )}
        >
          {mobileMoreOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <MoreHorizontal className="h-5 w-5" />
          )}
          More
        </button>
        {mobileMoreOpen && (
          <div className="quiet-reveal absolute bottom-[calc(100%+.65rem)] right-2 w-64 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0e14]/97 p-2 shadow-[0_24px_80px_rgba(0,0,0,.55)] backdrop-blur-2xl">
            <p className="px-3 pb-2 pt-1 text-[8px] font-bold uppercase tracking-[.22em] text-white/22">
              Long view & system
            </p>
            {mobileMoreRoutes.map((route) => {
              const Icon = route.icon;
              const active = routeIsActive(location, route.path);
              return (
                <Link
                  key={route.path}
                  href={route.path}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "sidebar-route flex items-center gap-3 rounded-2xl border px-3 py-2.5",
                    active
                      ? "border-[#ff7868]/16 bg-[#ff7868]/10 text-[#ff9a89]"
                      : "border-transparent text-white/55 hover:border-white/[.06] hover:bg-white/[.04] hover:text-white",
                  )}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/[.06] bg-white/[.03]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {route.label}
                    </span>
                    <span className="mt-0.5 block text-[9px] text-white/28">
                      {route.cue}
                    </span>
                  </span>
                </Link>
              );
            })}
            <div className="mx-2 my-1 h-px bg-white/[.055]" />
            <button
              type="button"
              onClick={() => void onLogout()}
              className="sidebar-route flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/45 hover:bg-white/[.04] hover:text-white"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/[.06] bg-white/[.03]">
                <LogOut className="h-4 w-4" />
              </span>
              Sign out
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
