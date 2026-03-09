import { InvoiceItem, InvoiceTotals } from "./invoice.types";

/**
 * Rounds a number to 2 decimal places.
 */
export const round2 = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates the total for a single invoice item.
 * total = quantity * unitPrice
 */
export const calculateItemTotal = (item: Pick<InvoiceItem, "quantity" | "unitPrice">): number => {
  return round2(item.quantity * item.unitPrice);
};

/**
 * Calculates the subtotal for a list of items.
 */
export const calculateSubTotal = (items: InvoiceItem[]): number => {
  const subTotal = items.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  return round2(subTotal);
};

/**
 * Calculates SGST and CGST based on the provided total tax percentage.
 * Default is 18% (9% SGST + 9% CGST).
 */
export const calculateGST = (subTotal: number, taxPercent: number = 18) => {
  const halfTax = taxPercent / 2;
  const sgst = round2(subTotal * (halfTax / 100));
  const cgst = round2(subTotal * (halfTax / 100));
  return { sgst, cgst };
};

/**
 * Calculates the grand total.
 */
export const calculateGrandTotal = (subTotal: number, sgst: number, cgst: number): number => {
  return round2(subTotal + sgst + cgst);
};

/**
 * Computes all invoice totals.
 */
export const calculateInvoiceTotals = (items: InvoiceItem[], taxPercent: number = 18): InvoiceTotals => {
  const subTotal = calculateSubTotal(items);
  const { sgst, cgst } = calculateGST(subTotal, taxPercent);
  const grandTotal = calculateGrandTotal(subTotal, sgst, cgst);

  return {
    subTotal,
    sgst,
    cgst,
    grandTotal,
  };
};
