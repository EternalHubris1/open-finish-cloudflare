import { Link, useLocation } from 'wouter';
import { Home, Target, Award, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const [location] = useLocation();

  const routes = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/activities', label: 'Activities', icon: Target },
    { path: '/achievements', label: 'Achievements', icon: Award },
    { path: '/alerts', label: 'Alerts', icon: Bell },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-64 flex flex-col h-screen sticky top-0 relative z-20 backdrop-blur-md border-r border-white/10" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Progress Checker</h1>
            <p className="text-xs text-white/40 uppercase tracking-widest">Track your journey</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
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
                  ? 'bg-blue-500/10 text-blue-300 font-semibold border border-blue-400/30'
                  : 'text-white/70 hover:text-white'
              )}
              data-testid={`nav-${route.label.toLowerCase()}`}
            >
              <Icon className="w-5 h-5" />
              <span>{route.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-white/30 text-center">
          Keep building momentum
        </div>
      </div>
    </aside>
  );
}
