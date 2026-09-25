"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ControlProps = {
  id: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

/**
 * Label + control + help text + error, wired for assistive tech (DS §20).
 * The child receives `id`, `aria-invalid` and `aria-describedby`.
 */
export function FormField({
  label,
  help,
  error,
  className,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  className?: string;
  children: (props: ControlProps) => React.ReactNode;
}) {
  const id = React.useId();
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {help && (
        <p id={helpId} className="text-body-sm text-muted-foreground">
          {help}
        </p>
      )}
      {error && (
        // Foreground text keeps AA contrast on card surfaces; the icon and the
        // control's red border carry the error colour.
        <p id={errorId} className="flex items-start gap-1.5 text-body-sm font-medium text-foreground">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
