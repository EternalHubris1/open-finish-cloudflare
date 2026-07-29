import { Link, useLocation } from 'wouter';
import { Home, Target, Award, Bell, User, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import musashi from '@assets/musashi_1785336444855.jpg';

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
    <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col h-screen sticky top-0 overflow-hidden relative">
      <div className="p-6 border-b border-sidebar-border relative z-10 bg-sidebar/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-foreground flex items-center justify-center border border-border">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-serif text-sidebar-foreground">Musashi</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Tracker</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 relative z-10">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = location === route.path;

          return (
            <Link
              key={route.path}
              href={route.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 border border-transparent',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm border-sidebar-border'
                  : 'text-sidebar-foreground'
              )}
              data-testid={`nav-${route.label.toLowerCase()}`}
            >
              <Icon className="w-5 h-5" />
              <span>{route.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Decorative Musashi Image at the bottom */}
      <div className="absolute bottom-0 left-0 w-full h-2/3 pointer-events-none z-0 overflow-hidden opacity-20 dark:opacity-30 mix-blend-multiply dark:mix-blend-lighten">
        <img 
          src={musashi} 
          alt="Musashi decoration" 
          className="w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-sidebar" />
      </div>

      <div className="p-4 border-t border-sidebar-border relative z-10 bg-sidebar/80 backdrop-blur-sm">
        <div className="text-xs text-muted-foreground text-center font-serif italic">
          "Step by step walk the thousand-mile road."
        </div>
      </div>
    </aside>
  );
}