import { Link, useLocation } from 'wouter';
import { Home, Target, Award, Bell, User, CalendarDays, Flame, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppSidebar({ onLogout }: { onLogout: () => Promise<void> }) {
  const [location] = useLocation();

  const routes = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/activities', label: 'Activities', icon: Target },
    { path: '/history', label: 'History', icon: CalendarDays },
    { path: '/streaks', label: 'Streaks', icon: Flame },
    { path: '/achievements', label: 'Achievements', icon: Award },
    { path: '/alerts', label: 'Alerts', icon: Bell },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
    <aside className="hidden w-64 flex-col h-screen sticky top-0 relative z-20 backdrop-blur-xl border-r border-white/5 md:flex" style={{ background: 'rgba(10, 10, 12, 0.6)' }}>
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 70%)' }}
               className="w-12 h-12 rounded-full border border-red-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
            <span className="text-xl font-bold text-red-500" style={{ fontFamily: 'serif' }}>道</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Progress</h1>
            <p className="text-[10px] text-red-400/80 uppercase tracking-widest font-bold">The Way</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = location === route.path;

          return (
            <Link
              key={route.path}
              href={route.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200',
                'hover:bg-white/5 hover:scale-[1.03] active:scale-[0.97]',
                isActive
                  ? 'bg-gradient-to-r from-red-500/15 to-transparent text-red-400 font-semibold border-l-2 border-red-500'
                  : 'text-white/50 hover:text-white'
              )}
              data-testid={`nav-${route.label.toLowerCase()}`}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-red-400" : "text-white/40")} />
              <span>{route.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5 relative overflow-hidden">
        <div className="relative z-10 text-[10px] text-white/30 text-center uppercase tracking-widest font-semibold">
          Keep building momentum
        </div>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-50 flex overflow-x-auto border-t border-white/10 bg-black/90 px-2 py-2 backdrop-blur-2xl md:hidden">
      {routes.map((route) => {
        const Icon = route.icon;
        const isActive = location === route.path;
        return (
          <Link
            key={route.path}
            href={route.path}
            className={cn(
              'flex min-w-[68px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[9px] font-bold uppercase tracking-wide',
              isActive ? 'bg-red-500/15 text-red-400' : 'text-white/35',
            )}
          >
            <Icon className="h-5 w-5" />
            {route.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => void onLogout()}
        className="flex min-w-[68px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[9px] font-bold uppercase tracking-wide text-white/35"
      >
        <LogOut className="h-5 w-5" />
        Sign out
      </button>
    </nav>
    </>
  );
}
