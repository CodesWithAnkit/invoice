import { cn } from "@/lib/utils";

// Visible marker for pages/widgets that still render static/mock data with
// no backend behind them yet — see context/redesign_implementation_plan.md.
export function DummyDataBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-warning",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
      Static Demo Data
    </span>
  );
}
