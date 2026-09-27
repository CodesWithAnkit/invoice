import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-success/10 text-success border-success/20",
  // Light mode darkens the text (from the same token) to meet 4.5:1 at 11px.
  warning: "bg-warning/10 text-[color-mix(in_oklab,hsl(var(--warning))_60%,black)] dark:text-warning border-warning/20",
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

// Project-specific status tones (R-18: Estimating, Quoted, Accepted, Rejected, Expired derived)
const projectStatusToneMap: Record<string, StatusTone> = {
  Draft: "neutral",
  Estimating: "warning",
  Quoted: "warning",
  Accepted: "success",
  Rejected: "danger",
  Expired: "danger",
  Completed: "success",
  Archived: "neutral",
};

export function toneForProjectStatus(status: string): StatusTone {
  return projectStatusToneMap[status] ?? "neutral";
}

// Quotation statuses (R-11, AC-QUOTE-005).
const quotationStatusToneMap: Record<string, StatusTone> = {
  Draft: "neutral",
  Sent: "warning",
  Viewed: "warning",
  Accepted: "success",
  Rejected: "danger",
  Expired: "danger",
  Archived: "neutral",
};

export function toneForQuotationStatus(status: string): StatusTone {
  return quotationStatusToneMap[status] ?? "neutral";
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
