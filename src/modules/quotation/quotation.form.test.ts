import { expect, test } from "@playwright/test";
import { emptyItem, emptyMilestone, formValuesToDraft, previewTotals, type QuotationFormValues } from "./quotation.form";
import { formatMinor, minorToInput, parseMoneyToMinor, parsePercentToBp, parseQuantity } from "./quotation.money";
import { QUOTATION_CAPS, QuotationDraftSchema } from "./quotation.schema";

const base = (overrides: Partial<QuotationFormValues> = {}): QuotationFormValues => ({
  title: "Website",
  issue_date: "2026-09-27",
  valid_until: "2026-10-27",
  discount_type: "none",
  discount_value: "",
  discount_percent: "",
  tax_name: "GST",
  tax_rate: "18",
  notes: "",
  internal_notes: "",
  terms: [],
  items: [],
  scope: { overview: "", deliverables: [], included: [], excluded: [], assumptions: [], revision_policy: "" },
  milestones: [],
  ...overrides,
});

test.describe("money parsing", () => {
  test("parses rupees to paise", () => {
    expect(parseMoneyToMinor("1500")).toBe(150_000);
    expect(parseMoneyToMinor("1,00,000.50")).toBe(10_000_050);
    expect(parseMoneyToMinor("₹ 25,000.00")).toBe(2_500_000);
    expect(parseMoneyToMinor("0.1")).toBe(10);
  });

  for (const s of ["-1", "abc", "1.234", "", "1e5", "NaN", "Infinity"]) {
    test(`rejects ${JSON.stringify(s)}`, () => {
      expect(parseMoneyToMinor(s)).toBeNull();
    });
  }

  test("parses percentages to basis points", () => {
    expect(parsePercentToBp("18")).toBe(1800);
    expect(parsePercentToBp("12.5%")).toBe(1250);
    expect(parsePercentToBp("12.555")).toBeNull();
  });

  test("parses quantities with up to 3 decimals", () => {
    expect(parseQuantity("0.5")).toBe(0.5);
    expect(parseQuantity("2.125")).toBe(2.125);
    expect(parseQuantity("1.0001")).toBeNull();
    expect(parseQuantity("-2")).toBeNull();
  });

  test("round-trips minor units to input strings", () => {
    expect(minorToInput(150_000)).toBe("1500");
    expect(minorToInput(150_005)).toBe("1500.05");
    expect(parseMoneyToMinor(minorToInput(123_456_789))).toBe(123_456_789);
  });

  test("formats INR with Indian grouping", () => {
    expect(formatMinor(10_620_000, "INR")).toBe("₹1,06,200.00");
  });
});

test.describe("formValuesToDraft", () => {
  test("converts a valid form to an API draft", () => {
    const result = formValuesToDraft(
      base({
        discount_type: "fixed",
        discount_value: "10,000",
        items: [{ ...emptyItem(), name: "Build", rate: "1,00,000" }],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.items[0]).toMatchObject({ quantity: 1, rate_minor: 10_000_000, percent_bp: 0 });
    expect(result.draft.discount_value_minor).toBe(1_000_000);
    expect(result.draft.tax_rate_bp).toBe(1800);
    const preview = previewTotals(result.draft);
    expect(preview.ok && preview.result.total_minor).toBe(10_620_000);
  });

  test("saves incomplete drafts: empty name and rate are allowed (AC-QUOTE-001)", () => {
    const result = formValuesToDraft(base({ title: "", items: [emptyItem()] }));
    expect(result.ok).toBe(true);
  });

  test("reports field-level errors for invalid inputs", () => {
    const result = formValuesToDraft(
      base({
        tax_rate: "150",
        items: [
          { ...emptyItem(), rate: "-5" },
          { ...emptyItem(), quantity: "" },
          { ...emptyItem(), pricing_model: "percentage", percent: "abc" },
        ],
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors["items.0.rate"]).toMatch(/non-negative/);
    expect(result.errors["items.1.quantity"]).toBe("Enter a quantity");
    expect(result.errors["items.2.percent"]).toMatch(/percentage/);
    expect(result.errors["tax_rate"]).toMatch(/100%/);
  });

  test("rejects valid_until before issue_date", () => {
    const result = formValuesToDraft(base({ valid_until: "2026-09-01" }));
    expect(!result.ok && result.errors["valid_until"]).toMatch(/on or after/);
  });

  test("enforces the one-page caps (R-15a)", () => {
    const tooMany = formValuesToDraft(
      base({
        items: Array.from({ length: QUOTATION_CAPS.items + 1 }, emptyItem),
        milestones: Array.from({ length: QUOTATION_CAPS.milestones + 1 }, emptyMilestone),
        scope: { ...base().scope, deliverables: Array(QUOTATION_CAPS.bulletsPerList + 1).fill("x") },
      })
    );
    expect(tooMany.ok).toBe(false);
    if (tooMany.ok) return;
    expect(tooMany.errors["items"]).toMatch(/at most 10 line items/);
    expect(tooMany.errors["milestones"]).toMatch(/at most 5 milestones/);
    expect(tooMany.errors["scope.deliverables"]).toMatch(/limited to 5/);
  });

  test("rejects overlong text", () => {
    const result = formValuesToDraft(
      base({ items: [{ ...emptyItem(), name: "x".repeat(QUOTATION_CAPS.itemNameChars + 1) }] })
    );
    expect(!result.ok && result.errors["items.0.name"]).toMatch(/limited to 80/);
  });
});

test.describe("QuotationDraftSchema (API)", () => {
  const valid = {
    title: "T",
    discount_type: "none",
    discount_value_minor: 0,
    discount_bp: 0,
    tax_rate_bp: 1800,
    items: [{ name: "A", pricing_model: "fixed", quantity: 1, rate_minor: 100, percent_bp: 0 }],
    scope: {},
    milestones: [],
  };

  test("strips client-sent totals", () => {
    const parsed = QuotationDraftSchema.parse({ ...valid, total_minor: 1, subtotal_minor: 1 });
    expect(parsed).not.toHaveProperty("total_minor");
  });

  const invalidItems: [string, Record<string, unknown>][] = [
    ["NaN rate", { rate_minor: Number.NaN }],
    ["Infinity rate", { rate_minor: Number.POSITIVE_INFINITY }],
    ["float minor units", { rate_minor: 1.5 }],
    ["negative quantity", { quantity: -1 }],
    ["zero quantity", { quantity: 0 }],
    ["4-decimal quantity", { quantity: 1.0001 }],
    ["unknown pricing model", { pricing_model: "barter" }],
  ];
  for (const [label, patch] of invalidItems) {
    test(`rejects ${label}`, () => {
      const result = QuotationDraftSchema.safeParse({ ...valid, items: [{ ...valid.items[0], ...patch }] });
      expect(result.success).toBe(false);
    });
  }

  test("rejects an invalid tax rate", () => {
    expect(QuotationDraftSchema.safeParse({ ...valid, tax_rate_bp: 10_001 }).success).toBe(false);
    expect(QuotationDraftSchema.safeParse({ ...valid, tax_rate_bp: -1 }).success).toBe(false);
  });
});
