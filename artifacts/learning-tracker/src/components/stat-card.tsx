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
        'rounded-sm p-6 border transition-all duration-200 bg-card relative overflow-hidden group',
        variant === 'primary' && 'border-l-4 border-l-primary border-t-card-border border-r-card-border border-b-card-border shadow-sm',
        variant === 'accent' && 'border-l-4 border-l-foreground border-t-card-border border-r-card-border border-b-card-border shadow-sm',
        variant === 'default' && 'border-card-border hover:border-foreground/30',
        className
      )}
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-serif font-bold tracking-tight text-foreground">{value}</p>
          {trend && (
            <p className="text-xs mt-2 text-muted-foreground italic font-serif">
              {trend}
            </p>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-sm border',
            variant === 'primary' && 'bg-primary/10 text-primary border-primary/20',
            variant === 'accent' && 'bg-foreground/10 text-foreground border-foreground/20',
            variant === 'default' && 'bg-muted text-muted-foreground border-transparent group-hover:text-foreground transition-colors'
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {/* Decorative ink splatter hint */}
      {variant === 'primary' && (
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      )}
    </div>
  );
}