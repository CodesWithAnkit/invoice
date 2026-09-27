import { calculateQuotation, QuotationCalcError, toQuantityMilli } from "./quotation.calculator";
import type { QuotationRecord, QuotationTotals } from "./quotation.types";

/**
 * Recomputes totals from a persisted quotation's own inputs (AC-DATA-004).
 * Returns null when the stored inputs are not calculable.
 */
export function computeTotalsFromRecord(
  record: Pick<QuotationRecord, "items" | "discount_type" | "discount_value_minor" | "discount_bp" | "tax_rate_bp">
): QuotationTotals | null {
  try {
    const r = calculateQuotation({
      items: record.items.map((item) => ({
        pricing_model: item.pricing_model,
        quantity_milli: item.pricing_model === "percentage" ? 1000 : toQuantityMilli(Number(item.quantity)),
        rate_minor: item.rate_minor,
        percent_bp: item.percent_bp,
      })),
      discount_type: record.discount_type,
      discount_value_minor: record.discount_value_minor,
      discount_bp: record.discount_bp,
      tax_rate_bp: record.tax_rate_bp,
    });
    return {
      subtotal_minor: r.subtotal_minor,
      discount_minor: r.discount_minor,
      taxable_minor: r.taxable_minor,
      tax_minor: r.tax_minor,
      total_minor: r.total_minor,
    };
  } catch (error) {
    if (error instanceof QuotationCalcError) return null;
    throw error;
  }
}
