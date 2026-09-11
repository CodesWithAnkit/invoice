import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
  trendTone?: "success" | "warning" | "danger";
  helperText?: string;
  className?: string;
}

const trendToneClasses = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
};

export function KpiCard({ label, value, trend, trendTone = "success", helperText, className }: KpiCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {trend && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold",
              trendToneClasses[trendTone]
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="mt-2 font-mono text-2xl md:text-3xl font-bold tabular-nums text-foreground">{value}</p>
      {helperText && <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
}
