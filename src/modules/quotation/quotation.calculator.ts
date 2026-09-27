// Quotation totals: docs/specs/mvp_implementation_plan.md §2.4 (R-04, R-07, R-08).
//
// Pure, integer-only arithmetic, shared by the route handlers (source of truth)
// and the estimate builder's live preview. Money is in minor units (paise),
// rates are basis points (18% = 1800), quantities are thousandths (0.5 → 500).
// The one rounding rule is round-half-up, applied only at the ⓡ steps.
//
// This module is deliberately separate from invoice.calculator.ts (float
// money, R-00); do not share helpers between them.

export const PRICING_MODELS = ["fixed", "hourly", "daily", "quantity", "percentage"] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export const DISCOUNT_TYPES = ["none", "fixed", "percent"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const BP_SCALE = 10_000;
export const QUANTITY_SCALE = 1_000;

export type CalcItem = {
  pricing_model: PricingModel;
  /** Quantity in thousandths. Ignored for percentage items. */
  quantity_milli: number;
  rate_minor: number;
  /** Ignored for non-percentage items. */
  percent_bp: number;
};

export type CalcInput = {
  items: CalcItem[];
  discount_type: DiscountType;
  discount_value_minor: number;
  discount_bp: number;
  tax_rate_bp: number;
};

export type CalcResult = {
  item_amounts_minor: number[];
  base_subtotal_minor: number;
  subtotal_minor: number;
  discount_minor: number;
  taxable_minor: number;
  tax_minor: number;
  total_minor: number;
};

export class QuotationCalcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotationCalcError";
  }
}

function assertMinor(value: number, label: string) {
  if (!Number.isSafeInteger(value)) throw new QuotationCalcError(`${label} must be a whole number of minor units.`);
  if (value < 0) throw new QuotationCalcError(`${label} cannot be negative.`);
}

function assertBp(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0 || value > BP_SCALE) {
    throw new QuotationCalcError(`${label} must be between 0% and 100%.`);
  }
}

/** round-half-up(numerator / denominator) for non-negative integers. */
export function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * BigInt(2) + denominator) / (denominator * BigInt(2));
}

function toSafeNumber(value: bigint, label: string): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new QuotationCalcError(`${label} is too large.`);
  return Number(value);
}

/** Converts a decimal quantity (max 3 dp, > 0) to thousandths. */
export function toQuantityMilli(quantity: number): number {
  if (!Number.isFinite(quantity)) throw new QuotationCalcError("Quantity must be a number.");
  if (quantity <= 0) throw new QuotationCalcError("Quantity must be greater than 0.");
  const milli = Math.round(quantity * QUANTITY_SCALE);
  if (Math.abs(milli - quantity * QUANTITY_SCALE) > 1e-6) {
    throw new QuotationCalcError("Quantity can have at most 3 decimal places.");
  }
  if (!Number.isSafeInteger(milli)) throw new QuotationCalcError("Quantity is too large.");
  return milli;
}

export function calculateQuotation(input: CalcInput): CalcResult {
  assertBp(input.tax_rate_bp, "Tax rate");

  // 1. Non-percentage line amounts ⓡ; 2. base subtotal (R-04).
  const amounts: bigint[] = input.items.map((item) => {
    if (item.pricing_model === "percentage") {
      assertBp(item.percent_bp, "Percentage");
      return BigInt(0);
    }
    if (!Number.isSafeInteger(item.quantity_milli) || item.quantity_milli <= 0) {
      throw new QuotationCalcError("Quantity must be greater than 0.");
    }
    assertMinor(item.rate_minor, "Rate");
    return roundHalfUp(BigInt(item.quantity_milli) * BigInt(item.rate_minor), BigInt(QUANTITY_SCALE));
  });
  const base = amounts.reduce((sum, a) => sum + a, BigInt(0));

  // 3. Percentage lines ⓡ — never part of their own base.
  input.items.forEach((item, i) => {
    if (item.pricing_model === "percentage") {
      amounts[i] = roundHalfUp(base * BigInt(item.percent_bp), BigInt(BP_SCALE));
    }
  });

  // 4. Subtotal.
  const subtotal = amounts.reduce((sum, a) => sum + a, BigInt(0));

  // 5. Discount (R-07): quotation-level, 0 ≤ discount ≤ subtotal.
  let discount = BigInt(0);
  if (input.discount_type === "fixed") {
    assertMinor(input.discount_value_minor, "Discount");
    discount = BigInt(input.discount_value_minor);
  } else if (input.discount_type === "percent") {
    assertBp(input.discount_bp, "Discount");
    discount = roundHalfUp(subtotal * BigInt(input.discount_bp), BigInt(BP_SCALE));
  } else if (input.discount_type !== "none") {
    throw new QuotationCalcError("Unknown discount type.");
  }
  if (discount > subtotal) throw new QuotationCalcError("Discount cannot exceed the subtotal.");

  // 6–8. Taxable, tax ⓡ, total.
  const taxable = subtotal - discount;
  const tax = roundHalfUp(taxable * BigInt(input.tax_rate_bp), BigInt(BP_SCALE));
  const total = taxable + tax;

  return {
    item_amounts_minor: amounts.map((a) => toSafeNumber(a, "Line amount")),
    base_subtotal_minor: toSafeNumber(base, "Subtotal"),
    subtotal_minor: toSafeNumber(subtotal, "Subtotal"),
    discount_minor: toSafeNumber(discount, "Discount"),
    taxable_minor: toSafeNumber(taxable, "Taxable amount"),
    tax_minor: toSafeNumber(tax, "Tax"),
    total_minor: toSafeNumber(total, "Total"),
  };
}
