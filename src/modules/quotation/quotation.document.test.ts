import { expect, test } from "@playwright/test";
import { calculateQuotation } from "./quotation.calculator";
import { allowedActions, buildDocument, logoUrl, validateForSend, withDraft } from "./quotation.document";
import { computeTotalsFromRecord } from "./quotation.reproduce";
import type { QuotationRecord } from "./quotation.types";

function record(overrides: Partial<QuotationRecord> = {}): QuotationRecord {
  const base: QuotationRecord = {
    id: "q1",
    project_id: "p1",
    customer_id: "c1",
    status: "Draft",
    title: "Website",
    issue_date: "2026-09-27",
    valid_until: "2026-10-27",
    currency: "INR",
    current_version: 1,
    quote_number: null,
    public_token: "secret-token",
    sent_at: null,
    discount_type: "fixed",
    discount_value_minor: 1_000_000,
    discount_bp: 0,
    tax_name: "GST",
    tax_rate_bp: 1800,
    subtotal_minor: 10_000_000,
    discount_minor: 1_000_000,
    taxable_minor: 9_000_000,
    tax_minor: 1_620_000,
    total_minor: 10_620_000,
    notes: "Thanks",
    internal_notes: "Private margin note",
    terms: ["50% advance"],
    created_at: "2026-09-27T00:00:00Z",
    updated_at: "2026-09-27T00:00:00Z",
    project: { id: "p1", name: "Website" },
    customer: { id: "c1", name: "Acme" },
    items: [
      {
        id: "i1",
        position: 0,
        service_id: null,
        name: "Build",
        description: null,
        pricing_model: "fixed",
        quantity: 1,
        unit: null,
        rate_minor: 10_000_000,
        percent_bp: 0,
        amount_minor: 10_000_000,
      },
    ],
    scope: { overview: null, deliverables: [], included: [], excluded: [], assumptions: [], revision_policy: null },
    milestones: [],
  };
  return { ...base, ...overrides };
}

const TODAY = "2026-09-27";

test.describe("validateForSend (AC-QUOTE-002/004)", () => {
  test("a complete draft is ready", () => {
    expect(validateForSend(record(), TODAY)).toEqual([]);
  });

  const cases: [string, Partial<QuotationRecord>, string][] = [
    ["no customer", { customer_id: null }, "customer"],
    ["no title", { title: "  " }, "title"],
    ["no issue date", { issue_date: null }, "issue_date"],
    ["no valid-until date", { valid_until: null }, "valid_until"],
    ["valid until before issue", { issue_date: "2026-10-01", valid_until: "2026-09-30" }, "valid_until"],
    ["valid until in the past", { issue_date: "2026-09-01", valid_until: "2026-09-26" }, "valid_until"],
    ["no items", { items: [], subtotal_minor: 0, discount_minor: 0, taxable_minor: 0, tax_minor: 0, total_minor: 0, discount_value_minor: 0, discount_type: "none" }, "items"],
    ["stale totals", { total_minor: 1 }, "total"],
    ["not a draft", { status: "Sent" }, "status"],
  ];
  for (const [label, overrides, field] of cases) {
    test(`flags ${label}`, () => {
      const fields = validateForSend(record(overrides), TODAY).map((i) => i.field);
      expect(fields).toContain(field);
    });
  }

  test("flags each unnamed item", () => {
    const r = record();
    const issues = validateForSend({ ...r, items: [{ ...r.items[0], name: "" }] }, TODAY);
    expect(issues.map((i) => i.field)).toContain("items.0.name");
  });

  test("valid until today is still valid", () => {
    expect(validateForSend(record({ issue_date: TODAY, valid_until: TODAY }), TODAY)).toEqual([]);
  });
});

test.describe("computeTotalsFromRecord (AC-DATA-004)", () => {
  test("reproduces the stored totals", () => {
    expect(computeTotalsFromRecord(record())).toEqual({
      subtotal_minor: 10_000_000,
      discount_minor: 1_000_000,
      taxable_minor: 9_000_000,
      tax_minor: 1_620_000,
      total_minor: 10_620_000,
    });
  });

  test("returns null for uncalculable stored inputs", () => {
    expect(computeTotalsFromRecord(record({ discount_value_minor: 99_999_999 }))).toBeNull();
  });
});

test.describe("allowedActions (R-11)", () => {
  test("matches the transition table", () => {
    expect(allowedActions("Draft")).toMatchObject({ edit: true, send: true, revise: false, archive: true, regenerateLink: false });
    for (const s of ["Sent", "Viewed", "Rejected", "Expired"] as const) {
      expect(allowedActions(s), s).toMatchObject({ edit: false, send: false, revise: true, archive: true });
    }
    expect(allowedActions("Accepted")).toMatchObject({ send: false, revise: false, archive: true });
    expect(allowedActions("Archived")).toMatchObject({ edit: false, send: false, revise: false, archive: false, regenerateLink: false });
  });
});

test.describe("documents", () => {
  const business = { name: "Studio", email: null, phone: null, address: null, website: null, tax_id: null, logo_url: null };

  test("the client document never carries owner-only fields", () => {
    const doc = buildDocument(record(), business, null, null);
    expect(doc.quotation).not.toHaveProperty("internal_notes");
    expect(doc.quotation).not.toHaveProperty("public_token");
    expect(JSON.stringify(doc)).not.toContain("Private margin note");
    expect(JSON.stringify(doc)).not.toContain("secret-token");
    expect(doc.quotation.version).toBe(1);
  });

  test("withDraft uses the calculator's amounts", () => {
    const base = buildDocument(record(), business, null, null);
    const draft = {
      title: "New",
      issue_date: TODAY,
      valid_until: TODAY,
      discount_type: "none" as const,
      discount_value_minor: 0,
      discount_bp: 0,
      tax_name: "GST",
      tax_rate_bp: 1800,
      notes: "",
      internal_notes: "",
      terms: ["", "Net 15"],
      items: [{ name: "A", pricing_model: "hourly" as const, quantity: 2, rate_minor: 500, percent_bp: 0 }],
      scope: { overview: "", deliverables: ["x", ""], included: [], excluded: [], assumptions: [], revision_policy: "" },
      milestones: [],
    };
    const totals = calculateQuotation({
      items: [{ pricing_model: "hourly", quantity_milli: 2000, rate_minor: 500, percent_bp: 0 }],
      discount_type: "none",
      discount_value_minor: 0,
      discount_bp: 0,
      tax_rate_bp: 1800,
    });
    const doc = withDraft(base, draft, totals);
    expect(doc.quotation.items[0].amount_minor).toBe(1000);
    expect(doc.quotation.total_minor).toBe(1180);
    expect(doc.quotation.terms).toEqual(["Net 15"]);
    expect(doc.quotation.scope.deliverables).toEqual(["x"]);
    expect(doc.quotation.notes).toBeNull();
  });

  test("logo only from an https URL", () => {
    expect(logoUrl("https://cdn.example/logo.png")).toBe("https://cdn.example/logo.png");
    expect(logoUrl("logos/abc.png")).toBeNull();
    expect(logoUrl("javascript:alert(1)")).toBeNull();
    expect(logoUrl(null)).toBeNull();
  });
});
