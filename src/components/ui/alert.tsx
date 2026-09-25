import * as React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "error" | "success" | "info";

// Body text stays `text-foreground` for contrast on the tinted backgrounds;
// the variant colour is carried by the border and icon.
const variantClasses: Record<AlertVariant, string> = {
  error: "border-destructive/50 bg-destructive/10 text-foreground",
  success: "border-success/50 bg-success/10 text-foreground",
  info: "border-border bg-muted text-foreground",
};

const iconClasses: Record<AlertVariant, string> = {
  error: "text-destructive",
  success: "text-success",
  info: "text-muted-foreground",
};

const variantIcons: Record<AlertVariant, React.ElementType> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

/**
 * Inline, persistent status message (DS §65 "Alert"). Errors are announced
 * immediately (role="alert"); success/info politely (role="status").
 */
export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = variantIcons[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-md border px-3 py-2.5 text-sm", variantClasses[variant], className)}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClasses[variant])} aria-hidden="true" />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "text-foreground/80")}>{children}</div>}
      </div>
    </div>
  );
}
