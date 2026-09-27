"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// DS §21 financial inputs. They hold what the user types (a string); parsing
// to minor units / basis points happens in src/modules/quotation/quotation.form.ts
// so the builder and the API share one validation path.

type AdornedProps = Omit<React.ComponentProps<"input">, "type"> & {
  prefix?: string;
  suffix?: string;
};

function AdornedInput({ prefix, suffix, className, ...props }: AdornedProps) {
  return (
    <div className="relative">
      {prefix && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
        >
          {prefix}
        </span>
      )}
      <Input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={cn("font-mono tabular-nums text-right", prefix && "pl-7", suffix && "pr-8", className)}
        {...props}
      />
      {suffix && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

const CURRENCY_SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

export function currencySymbol(currency: string) {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

/** Amount in major units (e.g. rupees), max 2 decimals. */
export function CurrencyInput({ currency = "INR", ...props }: Omit<AdornedProps, "prefix"> & { currency?: string }) {
  return <AdornedInput prefix={currencySymbol(currency)} placeholder="0.00" {...props} />;
}

/** Percentage 0–100, max 2 decimals. */
export function PercentageInput(props: Omit<AdornedProps, "suffix">) {
  return <AdornedInput suffix="%" placeholder="0" {...props} />;
}

/** Quantity > 0, max 3 decimals (R-09). */
export function QuantityInput(props: AdornedProps) {
  return <AdornedInput placeholder="1" {...props} />;
}
