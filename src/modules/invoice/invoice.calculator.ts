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
 * Calculates SGST and CGST (9% each).
 */
export const calculateGST = (subTotal: number) => {
  const sgst = round2(subTotal * 0.09);
  const cgst = round2(subTotal * 0.09);
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
export const calculateInvoiceTotals = (items: InvoiceItem[]): InvoiceTotals => {
  const subTotal = calculateSubTotal(items);
  const { sgst, cgst } = calculateGST(subTotal);
  const grandTotal = calculateGrandTotal(subTotal, sgst, cgst);

  return {
    subTotal,
    sgst,
    cgst,
    grandTotal,
  };
};
