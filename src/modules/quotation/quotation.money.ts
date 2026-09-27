// Display-side conversions for the quotation domain (R-08): people type rupees
// and percentages; the API and database hold minor units and basis points.

const DECIMAL = /^\d+(\.\d+)?$/;

function parseDecimal(input: string, maxDecimals: number, scale: number): number | null {
  const cleaned = input.replace(/[,\s₹$€£%]/g, "");
  if (!DECIMAL.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  if (fraction.length > maxDecimals) return null;
  const value = Number(whole) * scale + Number(fraction.padEnd(maxDecimals, "0") || "0");
  return Number.isSafeInteger(value) ? value : null;
}

/** "1,500.50" → 150050. Returns null for anything that isn't a non-negative amount with ≤ 2 decimals. */
export function parseMoneyToMinor(input: string): number | null {
  return parseDecimal(input.trim(), 2, 100);
}

/** "12.5" → 1250 basis points. Returns null when invalid; range is checked by the schema. */
export function parsePercentToBp(input: string): number | null {
  return parseDecimal(input.trim(), 2, 100);
}

/** "0.5" → 0.5 (max 3 decimals). Returns null when invalid. */
export function parseQuantity(input: string): number | null {
  const milli = parseDecimal(input.trim(), 3, 1000);
  return milli === null ? null : milli / 1000;
}

export function minorToInput(minor: number): string {
  const whole = Math.floor(minor / 100);
  const fraction = minor % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, "0")}`;
}

export function bpToInput(bp: number): string {
  return minorToInput(bp);
}

export function formatMinor(minor: number, currency = "INR"): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2 }).format(
      minor / 100
    );
  } catch {
    return `${currency} ${(minor / 100).toFixed(2)}`;
  }
}

export function formatBp(bp: number): string {
  return `${bpToInput(bp)}%`;
}
