import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'primary' | 'accent';
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, variant = 'default', className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 border backdrop-blur-md transition-all duration-200 relative overflow-hidden group hover:scale-[1.02]',
        variant === 'primary' && 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-400/30 shadow-2xl',
        variant === 'accent' && 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-400/30 shadow-2xl',
        variant === 'default' && 'bg-white/5 border-white/10 hover:border-white/20',
        className
      )}
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-xs font-semibold mb-2 text-white/40 uppercase tracking-widest">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          {trend && (
            <p className="text-xs mt-2 text-white/50">
              {trend}
            </p>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-full',
            variant === 'primary' && 'bg-orange-500/20 text-orange-300',
            variant === 'accent' && 'bg-amber-500/20 text-amber-300',
            variant === 'default' && 'bg-white/10 text-white/70 group-hover:text-white transition-colors'
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {variant === 'primary' && (
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
      )}
      {variant === 'accent' && (
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      )}
    </div>
  );
}
