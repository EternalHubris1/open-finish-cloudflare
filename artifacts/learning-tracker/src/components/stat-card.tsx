import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "primary" | "accent";
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl p-6 border backdrop-blur-xl transition-all duration-300 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-1",
        variant === "primary" &&
          "bg-gradient-to-br from-red-900/40 to-red-950/40 border-red-500/30 shadow-2xl",
        variant === "accent" &&
          "bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/20 shadow-2xl",
        variant === "default" &&
          "bg-[rgba(15,15,20,0.85)] border-white/10 hover:border-white/20",
        className,
      )}
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p
            className="min-h-8 line-clamp-2 text-[10px] font-bold uppercase tracking-widest text-white/40"
            title={label}
          >
            {label}
          </p>
          <p
            className="mt-1 line-clamp-2 text-3xl font-bold tracking-tight text-white"
            title={String(value)}
          >
            {value}
          </p>
          {trend && (
            <p
              className="mt-2 line-clamp-2 text-[11px] font-semibold uppercase tracking-wider text-white/50"
              title={trend}
            >
              {trend}
            </p>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-full",
            variant === "primary" && "bg-red-500/20 text-red-400",
            variant === "accent" && "bg-orange-500/20 text-orange-400",
            variant === "default" &&
              "bg-white/5 text-white/40 group-hover:text-white transition-colors",
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {variant === "primary" && (
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      )}
      {variant === "accent" && (
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
      )}
    </div>
  );
}
