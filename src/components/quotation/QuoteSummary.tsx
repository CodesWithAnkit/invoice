import { formatBp, formatMinor } from "@/modules/quotation/quotation.money";
import type { QuotationTotals } from "@/modules/quotation/quotation.types";
import { cn } from "@/lib/utils";

// DS §35 Quote Summary: Subtotal → Discount → Tax → Total. Pure display of
// totals it is given; it never computes (the builder passes calculator output,
// detail/preview pages will pass persisted values).
export function QuoteSummary({
  totals,
  currency,
  taxName,
  taxRateBp,
  discountLabel,
  className,
}: {
  totals: QuotationTotals;
  currency: string;
  taxName?: string | null;
  taxRateBp: number;
  discountLabel?: string;
  className?: string;
}) {
  const row = "flex justify-between gap-4 text-muted-foreground";
  return (
    <section aria-label="Quote summary" className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <p className="mb-4 font-semibold text-foreground">Quote Summary</p>
      <dl className="space-y-2 text-sm">
        <div className={row}>
          <dt>Subtotal</dt>
          <dd className="font-mono tabular-nums" data-testid="summary-subtotal">
            {formatMinor(totals.subtotal_minor, currency)}
          </dd>
        </div>
        <div className={row}>
          <dt>Discount{discountLabel ? ` (${discountLabel})` : ""}</dt>
          <dd className="font-mono tabular-nums" data-testid="summary-discount">
            {totals.discount_minor > 0 ? "−" : ""}
            {formatMinor(totals.discount_minor, currency)}
          </dd>
        </div>
        <div className={row}>
          <dt>Taxable amount</dt>
          <dd className="font-mono tabular-nums" data-testid="summary-taxable">
            {formatMinor(totals.taxable_minor, currency)}
          </dd>
        </div>
        <div className={row}>
          <dt>
            {taxName || "Tax"} {formatBp(taxRateBp)}
          </dt>
          <dd className="font-mono tabular-nums" data-testid="summary-tax">
            {formatMinor(totals.tax_minor, currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-bold text-foreground">
          <dt>Total</dt>
          <dd className="font-mono tabular-nums text-primary" data-testid="summary-total">
            {formatMinor(totals.total_minor, currency)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
