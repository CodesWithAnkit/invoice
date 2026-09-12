import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

const statusToneMap: Record<string, StatusTone> = {
  RECONCILED: "success",
  PAID: "success",
  ACTIVE: "success",
  VIEWED: "neutral",
  SENT: "neutral",
  DRAFT: "neutral",
  DUE: "warning",
  "PARTIAL PAY": "warning",
  BACKORDERED: "warning",
  OVERDUE: "danger",
  CANCELLED: "danger",
  DEPRECATED: "danger",
  "FAILED PAYOUT": "danger",
};

export function toneForStatus(status: string): StatusTone {
  return statusToneMap[status.toUpperCase()] ?? "neutral";
}

export function StatusBadge({
  status,
  tone,
  className,
}: {
  status: string;
  tone?: StatusTone;
  className?: string;
}) {
  const resolvedTone = tone ?? toneForStatus(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wide",
        toneClasses[resolvedTone],
        className
      )}
    >
      {status}
    </span>
  );
}
