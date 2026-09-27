import { QuotationCalcError, calculateQuotation, type CalcResult, type DiscountType, type PricingModel } from "./quotation.calculator";
import { bpToInput, minorToInput, parseMoneyToMinor, parsePercentToBp, parseQuantity } from "./quotation.money";
import { QuotationDraftSchema, describeIssue, type QuotationDraft } from "./quotation.schema";
import type { QuotationRecord } from "./quotation.types";

// Estimate-builder form state ⇄ API draft. The builder keeps one grouped
// `values` object of strings (what people type); this module turns it into a
// QuotationDraft and validates it with the same schema the API uses.

export type ItemFormValues = {
  key: string;
  service_id: string | null;
  name: string;
  description: string;
  pricing_model: PricingModel;
  quantity: string;
  unit: string;
  rate: string;
  percent: string;
};

export type MilestoneFormValues = {
  key: string;
  name: string;
  description: string;
  start_label: string;
  end_label: string;
};

export type ScopeListKey = "deliverables" | "included" | "excluded" | "assumptions";

export type QuotationFormValues = {
  title: string;
  issue_date: string;
  valid_until: string;
  discount_type: DiscountType;
  discount_value: string;
  discount_percent: string;
  tax_name: string;
  tax_rate: string;
  notes: string;
  internal_notes: string;
  terms: string[];
  items: ItemFormValues[];
  scope: {
    overview: string;
    deliverables: string[];
    included: string[];
    excluded: string[];
    assumptions: string[];
    revision_policy: string;
  };
  milestones: MilestoneFormValues[];
};

/** Field errors keyed by path, e.g. "items.0.rate", "discount", "valid_until". */
export type FormErrors = Record<string, string>;

let keySeq = 0;
export const newKey = () => `k${Date.now().toString(36)}${(keySeq++).toString(36)}`;

export function emptyItem(): ItemFormValues {
  return {
    key: newKey(),
    service_id: null,
    name: "",
    description: "",
    pricing_model: "fixed",
    quantity: "1",
    unit: "",
    rate: "",
    percent: "",
  };
}

export function emptyMilestone(): MilestoneFormValues {
  return { key: newKey(), name: "", description: "", start_label: "", end_label: "" };
}

export function recordToFormValues(q: QuotationRecord): QuotationFormValues {
  return {
    title: q.title ?? "",
    issue_date: q.issue_date ?? "",
    valid_until: q.valid_until ?? "",
    discount_type: q.discount_type,
    discount_value: q.discount_value_minor ? minorToInput(q.discount_value_minor) : "",
    discount_percent: q.discount_bp ? bpToInput(q.discount_bp) : "",
    tax_name: q.tax_name ?? "",
    tax_rate: bpToInput(q.tax_rate_bp),
    notes: q.notes ?? "",
    internal_notes: q.internal_notes ?? "",
    terms: q.terms,
    items: q.items.map((item) => ({
      key: item.id,
      service_id: item.service_id,
      name: item.name,
      description: item.description ?? "",
      pricing_model: item.pricing_model,
      quantity: String(item.quantity),
      unit: item.unit ?? "",
      rate: minorToInput(item.rate_minor),
      percent: bpToInput(item.percent_bp),
    })),
    scope: {
      overview: q.scope.overview ?? "",
      deliverables: q.scope.deliverables,
      included: q.scope.included,
      excluded: q.scope.excluded,
      assumptions: q.scope.assumptions,
      revision_policy: q.scope.revision_policy ?? "",
    },
    milestones: q.milestones.map((m) => ({
      key: m.id,
      name: m.name,
      description: m.description ?? "",
      start_label: m.start_label ?? "",
      end_label: m.end_label ?? "",
    })),
  };
}

// Schema paths → form field paths where the names differ.
function formPath(path: PropertyKey[]): string {
  const p = path.map(String);
  if (p[0] === "items" && p.length >= 3) {
    const field = { quantity: "quantity", rate_minor: "rate", percent_bp: "percent" }[p[2]] ?? p[2];
    return `items.${p[1]}.${field}`;
  }
  if (p[0] === "discount_value_minor" || p[0] === "discount_bp") return "discount";
  if (p[0] === "tax_rate_bp") return "tax_rate";
  return p.join(".");
}

export type ToDraftResult = { ok: true; draft: QuotationDraft } | { ok: false; errors: FormErrors };

/** Parses and validates the builder values. Empty rates count as 0 so incomplete drafts still save (AC-QUOTE-001). */
export function formValuesToDraft(values: QuotationFormValues): ToDraftResult {
  const errors: FormErrors = {};
  const num = (
    raw: string,
    parse: (s: string) => number | null,
    path: string,
    message: string,
    { empty = 0, required }: { empty?: number; required?: string } = {}
  ) => {
    if (raw.trim() === "") {
      if (required) errors[path] = required;
      return empty;
    }
    const parsed = parse(raw);
    if (parsed === null) {
      errors[path] = message;
      return 0;
    }
    return parsed;
  };

  const items = values.items.map((item, i) => {
    const isPercent = item.pricing_model === "percentage";
    return {
      service_id: item.service_id,
      name: item.name,
      description: item.description,
      pricing_model: item.pricing_model,
      quantity: isPercent
        ? 1
        : num(item.quantity, parseQuantity, `items.${i}.quantity`, "Use a positive number with up to 3 decimals", {
            empty: 1,
            required: "Enter a quantity",
          }),
      unit: item.unit,
      rate_minor: isPercent ? 0 : num(item.rate, parseMoneyToMinor, `items.${i}.rate`, "Use a non-negative amount with up to 2 decimals"),
      percent_bp: isPercent ? num(item.percent, parsePercentToBp, `items.${i}.percent`, "Use a percentage between 0 and 100") : 0,
    };
  });

  const candidate = {
    title: values.title,
    issue_date: values.issue_date || null,
    valid_until: values.valid_until || null,
    discount_type: values.discount_type,
    discount_value_minor:
      values.discount_type === "fixed"
        ? num(values.discount_value, parseMoneyToMinor, "discount", "Use a non-negative amount with up to 2 decimals")
        : 0,
    discount_bp:
      values.discount_type === "percent"
        ? num(values.discount_percent, parsePercentToBp, "discount", "Use a percentage between 0 and 100")
        : 0,
    tax_name: values.tax_name,
    tax_rate_bp: num(values.tax_rate, parsePercentToBp, "tax_rate", "Use a percentage between 0 and 100"),
    notes: values.notes,
    internal_notes: values.internal_notes,
    terms: values.terms,
    items,
    scope: values.scope,
    milestones: values.milestones.map(({ name, description, start_label, end_label }) => ({
      name,
      description,
      start_label,
      end_label,
    })),
  };

  const parsed = QuotationDraftSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = formPath(issue.path);
      errors[path] ??= issue.path.length > 1 ? issue.message : describeIssue(issue);
    }
  }
  if (Object.keys(errors).length > 0 || !parsed.success) return { ok: false, errors };
  return { ok: true, draft: parsed.data };
}

export type PreviewResult = { ok: true; result: CalcResult } | { ok: false; error: string };

/** Live totals for the builder — the same calculator the server runs on save. */
export function previewTotals(draft: QuotationDraft): PreviewResult {
  try {
    return {
      ok: true,
      result: calculateQuotation({
        items: draft.items.map((item) => ({
          pricing_model: item.pricing_model,
          quantity_milli: Math.round(item.quantity * 1000),
          rate_minor: item.rate_minor,
          percent_bp: item.percent_bp,
        })),
        discount_type: draft.discount_type,
        discount_value_minor: draft.discount_value_minor,
        discount_bp: draft.discount_bp,
        tax_rate_bp: draft.tax_rate_bp,
      }),
    };
  } catch (error) {
    if (error instanceof QuotationCalcError) return { ok: false, error: error.message };
    throw error;
  }
}
