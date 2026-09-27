import { expect, test } from "@playwright/test";
import {
  QuotationCalcError,
  calculateQuotation,
  roundHalfUp,
  toQuantityMilli,
  type CalcInput,
  type CalcItem,
} from "./quotation.calculator";

const rupees = (r: number) => Math.round(r * 100);
const item = (overrides: Partial<CalcItem>): CalcItem => ({
  pricing_model: "fixed",
  quantity_milli: 1000,
  rate_minor: 0,
  percent_bp: 0,
  ...overrides,
});
const input = (items: CalcItem[], overrides: Partial<CalcInput> = {}): CalcInput => ({
  items,
  discount_type: "none",
  discount_value_minor: 0,
  discount_bp: 0,
  tax_rate_bp: 0,
  ...overrides,
});

test.describe("line amounts by pricing model", () => {
  test("fixed: 1 × ₹50,000 = ₹50,000 (AC-ESTIMATE-003)", () => {
    const r = calculateQuotation(input([item({ rate_minor: rupees(50_000) })]));
    expect(r.item_amounts_minor).toEqual([rupees(50_000)]);
  });

  test("hourly: 40 × ₹2,000 = ₹80,000 (AC-ESTIMATE-004)", () => {
    const r = calculateQuotation(
      input([item({ pricing_model: "hourly", quantity_milli: 40_000, rate_minor: rupees(2_000) })])
    );
    expect(r.item_amounts_minor).toEqual([rupees(80_000)]);
  });

  test("quantity: 12 × ₹450 = ₹5,400 (AC-ESTIMATE-005)", () => {
    const r = calculateQuotation(
      input([item({ pricing_model: "quantity", quantity_milli: 12_000, rate_minor: rupees(450) })])
    );
    expect(r.item_amounts_minor).toEqual([rupees(5_400)]);
  });

  test("daily: 5 × ₹8,000 = ₹40,000 (AC-ESTIMATE-006)", () => {
    const r = calculateQuotation(
      input([item({ pricing_model: "daily", quantity_milli: 5_000, rate_minor: rupees(8_000) })])
    );
    expect(r.item_amounts_minor).toEqual([rupees(40_000)]);
  });

  test("fractional quantity: 0.5 h × ₹1,500 = ₹750 (R-09)", () => {
    const r = calculateQuotation(input([item({ pricing_model: "hourly", quantity_milli: 500, rate_minor: rupees(1_500) })]));
    expect(r.item_amounts_minor).toEqual([rupees(750)]);
  });

  test("zero rate is allowed (complimentary item)", () => {
    const r = calculateQuotation(input([item({ rate_minor: 0 })]));
    expect(r.total_minor).toBe(0);
  });
});

test.describe("percentage items (R-04, AC-ESTIMATE-007)", () => {
  test("project management 10% of ₹4,00,000 base = ₹40,000", () => {
    const r = calculateQuotation(
      input([
        item({ rate_minor: rupees(400_000) }),
        item({ pricing_model: "percentage", percent_bp: 1000 }),
      ])
    );
    expect(r.base_subtotal_minor).toBe(rupees(400_000));
    expect(r.item_amounts_minor).toEqual([rupees(400_000), rupees(40_000)]);
    expect(r.subtotal_minor).toBe(rupees(440_000));
  });

  test("percentage items never include other percentage items (no circularity)", () => {
    const r = calculateQuotation(
      input([
        item({ rate_minor: rupees(100_000) }),
        item({ pricing_model: "percentage", percent_bp: 1000 }),
        item({ pricing_model: "percentage", percent_bp: 500 }),
      ])
    );
    expect(r.item_amounts_minor).toEqual([rupees(100_000), rupees(10_000), rupees(5_000)]);
  });

  test("ignores quantity and rate on percentage items", () => {
    const r = calculateQuotation(
      input([
        item({ rate_minor: rupees(1_000) }),
        item({ pricing_model: "percentage", percent_bp: 1000, quantity_milli: 9_000, rate_minor: rupees(99) }),
      ])
    );
    expect(r.item_amounts_minor[1]).toBe(rupees(100));
  });

  test("percentage with no base is zero", () => {
    const r = calculateQuotation(input([item({ pricing_model: "percentage", percent_bp: 1500 })]));
    expect(r.total_minor).toBe(0);
  });
});

test.describe("discount, tax and total (AC-CALC-001…003)", () => {
  test("AC-CALC-003: ₹1,00,000 − ₹10,000 fixed, 18% tax → ₹1,06,200", () => {
    const r = calculateQuotation(
      input([item({ rate_minor: rupees(100_000) })], {
        discount_type: "fixed",
        discount_value_minor: rupees(10_000),
        tax_rate_bp: 1800,
      })
    );
    expect(r).toMatchObject({
      subtotal_minor: 10_000_000,
      discount_minor: 1_000_000,
      taxable_minor: 9_000_000,
      tax_minor: 1_620_000,
      total_minor: 10_620_000,
    });
  });

  test("PRD §21: ₹4,00,000 − 10%, 18% tax → ₹4,24,800", () => {
    const r = calculateQuotation(
      input([item({ rate_minor: rupees(400_000) })], { discount_type: "percent", discount_bp: 1000, tax_rate_bp: 1800 })
    );
    expect(r.discount_minor).toBe(rupees(40_000));
    expect(r.taxable_minor).toBe(rupees(360_000));
    expect(r.tax_minor).toBe(rupees(64_800));
    expect(r.total_minor).toBe(rupees(424_800));
  });

  test("subtotal is the sum of all line amounts", () => {
    const r = calculateQuotation(
      input([item({ rate_minor: 123 }), item({ rate_minor: 456 }), item({ quantity_milli: 2000, rate_minor: 5 })])
    );
    expect(r.subtotal_minor).toBe(123 + 456 + 10);
  });

  test("discount equal to the subtotal is allowed", () => {
    const r = calculateQuotation(
      input([item({ rate_minor: 5000 })], { discount_type: "fixed", discount_value_minor: 5000, tax_rate_bp: 1800 })
    );
    expect(r.total_minor).toBe(0);
  });

  test("100% discount is allowed", () => {
    const r = calculateQuotation(input([item({ rate_minor: 5000 })], { discount_type: "percent", discount_bp: 10000 }));
    expect(r.taxable_minor).toBe(0);
  });

  test("discount type 'none' ignores stale discount values", () => {
    const r = calculateQuotation(
      input([item({ rate_minor: 5000 })], { discount_type: "none", discount_value_minor: 999_999, discount_bp: 5000 })
    );
    expect(r.discount_minor).toBe(0);
  });

  test("no items → all zeros", () => {
    const r = calculateQuotation(input([], { tax_rate_bp: 1800 }));
    expect(r).toMatchObject({ subtotal_minor: 0, discount_minor: 0, tax_minor: 0, total_minor: 0 });
  });
});

test.describe("rounding: half up, only at the defined boundaries (R-08)", () => {
  test("roundHalfUp rounds ties up and others to nearest", () => {
    expect(roundHalfUp(BigInt(5), BigInt(10))).toBe(BigInt(1));
    expect(roundHalfUp(BigInt(4), BigInt(10))).toBe(BigInt(0));
    expect(roundHalfUp(BigInt(15), BigInt(10))).toBe(BigInt(2));
    expect(roundHalfUp(BigInt(25), BigInt(10))).toBe(BigInt(3));
    expect(roundHalfUp(BigInt(0), BigInt(7))).toBe(BigInt(0));
  });

  test("line tie: 0.5 × 1 paisa → 1 paisa", () => {
    const r = calculateQuotation(input([item({ quantity_milli: 500, rate_minor: 1 })]));
    expect(r.item_amounts_minor).toEqual([1]);
  });

  test("line below half: 0.001 × 499 paise → 0", () => {
    const r = calculateQuotation(input([item({ quantity_milli: 1, rate_minor: 499 })]));
    expect(r.item_amounts_minor).toEqual([0]);
  });

  test("tax tie: 18% of 25 paise = 4.5 → 5", () => {
    const r = calculateQuotation(input([item({ rate_minor: 25 })], { tax_rate_bp: 1800 }));
    expect(r.tax_minor).toBe(5);
    expect(r.total_minor).toBe(30);
  });

  test("percent discount tie: 12.5% of 4 paise = 0.5 → 1", () => {
    const r = calculateQuotation(input([item({ rate_minor: 4 })], { discount_type: "percent", discount_bp: 1250 }));
    expect(r.discount_minor).toBe(1);
  });

  test("percentage item tie: 5% of 10 paise = 0.5 → 1", () => {
    const r = calculateQuotation(
      input([item({ rate_minor: 10 }), item({ pricing_model: "percentage", percent_bp: 500 })])
    );
    expect(r.item_amounts_minor[1]).toBe(1);
  });

  test("rounds each line before summing, not the sum", () => {
    // Each line is 0.5 paise → 1; summing unrounded would give 1, not 3.
    const r = calculateQuotation(input([1, 2, 3].map(() => item({ quantity_milli: 500, rate_minor: 1 }))));
    expect(r.subtotal_minor).toBe(3);
  });

  test("large but safe values stay exact", () => {
    const r = calculateQuotation(
      input([item({ quantity_milli: 999_999_000, rate_minor: 1_000_000_000 })], { tax_rate_bp: 1800 })
    );
    expect(r.subtotal_minor).toBe(999_999_000_000_000);
    expect(r.tax_minor).toBe(179_999_820_000_000);
  });
});

test.describe("invalid values are rejected (AC-CALC-005)", () => {
  const cases: [string, CalcInput][] = [
    ["negative rate", input([item({ rate_minor: -1 })])],
    ["NaN rate", input([item({ rate_minor: Number.NaN })])],
    ["infinite rate", input([item({ rate_minor: Number.POSITIVE_INFINITY })])],
    ["non-integer minor units", input([item({ rate_minor: 10.5 })])],
    ["zero quantity", input([item({ quantity_milli: 0, rate_minor: 1 })])],
    ["negative quantity", input([item({ quantity_milli: -1000, rate_minor: 1 })])],
    ["NaN quantity", input([item({ quantity_milli: Number.NaN, rate_minor: 1 })])],
    ["percentage above 100%", input([item({ pricing_model: "percentage", percent_bp: 10_001 })])],
    ["negative percentage", input([item({ pricing_model: "percentage", percent_bp: -1 })])],
    ["negative tax", input([], { tax_rate_bp: -1 })],
    ["tax above 100%", input([], { tax_rate_bp: 10_001 })],
    ["NaN tax", input([], { tax_rate_bp: Number.NaN })],
    ["negative fixed discount", input([item({ rate_minor: 100 })], { discount_type: "fixed", discount_value_minor: -1 })],
    ["infinite fixed discount", input([item({ rate_minor: 100 })], { discount_type: "fixed", discount_value_minor: Infinity })],
    ["fixed discount above subtotal", input([item({ rate_minor: 100 })], { discount_type: "fixed", discount_value_minor: 101 })],
    ["percent discount above 100%", input([item({ rate_minor: 100 })], { discount_type: "percent", discount_bp: 10_001 })],
    ["unknown discount type", input([], { discount_type: "bogus" as never })],
    ["unsafe result", input([item({ quantity_milli: Number.MAX_SAFE_INTEGER, rate_minor: 1_000_000 })])],
  ];

  for (const [label, bad] of cases) {
    test(label, () => {
      expect(() => calculateQuotation(bad)).toThrow(QuotationCalcError);
    });
  }
});

test.describe("toQuantityMilli (R-09)", () => {
  test("converts up to 3 decimals exactly", () => {
    expect(toQuantityMilli(1)).toBe(1000);
    expect(toQuantityMilli(0.5)).toBe(500);
    expect(toQuantityMilli(2.125)).toBe(2125);
    expect(toQuantityMilli(0.001)).toBe(1);
  });

  for (const q of [0, -1, 0.0001, 1.2345, Number.NaN, Number.POSITIVE_INFINITY]) {
    test(`rejects ${q}`, () => {
      expect(() => toQuantityMilli(q)).toThrow(QuotationCalcError);
    });
  }
});
