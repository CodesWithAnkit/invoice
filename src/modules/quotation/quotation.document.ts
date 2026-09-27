import type { CalcResult } from "./quotation.calculator";
import type { QuotationDraft } from "./quotation.schema";
import type { QuotationRecord, QuotationStatus } from "./quotation.types";
import { computeTotalsFromRecord } from "./quotation.reproduce";

// The client-facing quotation document: what the preview, the PDF and (Phase 7)
// the public page render. A sent version stores exactly this as its immutable
// snapshot (R-03, AC-DATA-002/003); a draft is rendered from live data in the
// same shape. Internal notes are never part of it.

export type DocumentBusiness = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  tax_id: string | null;
  logo_url: string | null;
};

export type DocumentCustomer = {
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
};

export type DocumentProject = { name: string; description: string | null };

export type QuotationDocument = {
  business: DocumentBusiness;
  customer: DocumentCustomer | null;
  project: DocumentProject | null;
  quotation: Omit<
    QuotationRecord,
    "internal_notes" | "public_token" | "project" | "customer" | "created_at" | "updated_at" | "status"
  > & { version: number };
};

export function buildDocument(
  record: QuotationRecord,
  business: DocumentBusiness,
  customer: DocumentCustomer | null,
  project: DocumentProject | null
): QuotationDocument {
  // Allow-list: only client-visible fields enter the document.
  const r = record;
  return {
    business,
    customer,
    project,
    quotation: {
      id: r.id,
      project_id: r.project_id,
      customer_id: r.customer_id,
      title: r.title,
      quote_number: r.quote_number,
      sent_at: r.sent_at,
      issue_date: r.issue_date,
      valid_until: r.valid_until,
      currency: r.currency,
      current_version: r.current_version,
      version: r.current_version,
      discount_type: r.discount_type,
      discount_value_minor: r.discount_value_minor,
      discount_bp: r.discount_bp,
      tax_name: r.tax_name,
      tax_rate_bp: r.tax_rate_bp,
      subtotal_minor: r.subtotal_minor,
      discount_minor: r.discount_minor,
      taxable_minor: r.taxable_minor,
      tax_minor: r.tax_minor,
      total_minor: r.total_minor,
      notes: r.notes,
      terms: r.terms,
      items: r.items,
      scope: r.scope,
      milestones: r.milestones,
    },
  };
}

/** Logo only when it is already a URL; there is no logo upload yet (AC-PDF-005). */
export function logoUrl(logoPath: string | null | undefined): string | null {
  return logoPath && /^https:\/\//i.test(logoPath) ? logoPath : null;
}

export type SendIssue = { field: string; message: string };

/**
 * AC-QUOTE-002 / AC-QUOTE-004: what must be true before Draft → Sent.
 * `today` is YYYY-MM-DD in the business time zone.
 */
export function validateForSend(record: QuotationRecord, today: string): SendIssue[] {
  const issues: SendIssue[] = [];
  if (record.status !== "Draft") issues.push({ field: "status", message: "Only draft quotations can be sent." });
  if (!record.customer_id) issues.push({ field: "customer", message: "Link a customer to the project." });
  if (!record.project_id) issues.push({ field: "project", message: "The quotation needs a project." });
  if (!record.title.trim()) issues.push({ field: "title", message: "Add a title." });
  if (!record.issue_date) issues.push({ field: "issue_date", message: "Set the issue date." });
  if (!record.valid_until) {
    issues.push({ field: "valid_until", message: "Set the valid-until date." });
  } else {
    if (record.issue_date && record.valid_until < record.issue_date) {
      issues.push({ field: "valid_until", message: "Valid until must be on or after the issue date." });
    }
    if (record.valid_until < today) {
      issues.push({ field: "valid_until", message: "Valid until is in the past." });
    }
  }
  if (record.items.length === 0) {
    issues.push({ field: "items", message: "Add at least one line item." });
  }
  record.items.forEach((item, i) => {
    if (!item.name.trim()) issues.push({ field: `items.${i}.name`, message: `Item ${i + 1} needs a name.` });
  });

  // "Valid total": the stored totals must be reproducible from stored inputs (AC-DATA-004).
  const recomputed = computeTotalsFromRecord(record);
  if (!recomputed) {
    issues.push({ field: "total", message: "The totals can't be calculated. Check the line items and discount." });
  } else if (
    recomputed.total_minor !== record.total_minor ||
    recomputed.subtotal_minor !== record.subtotal_minor ||
    recomputed.tax_minor !== record.tax_minor ||
    recomputed.discount_minor !== record.discount_minor
  ) {
    issues.push({ field: "total", message: "The saved totals are out of date. Save the draft again." });
  }
  return issues;
}

/** R-11: which owner actions are available in each status. */
export function allowedActions(status: QuotationStatus) {
  return {
    edit: status === "Draft",
    send: status === "Draft",
    revise: status === "Sent" || status === "Viewed" || status === "Rejected" || status === "Expired",
    archive: status !== "Archived",
    duplicate: true,
    regenerateLink: status !== "Draft" && status !== "Archived",
  };
}

/**
 * The builder's unsaved draft as a document, for the live one-page check.
 * Amounts come from the shared calculator's output, never recomputed here.
 */
export function withDraft(base: QuotationDocument, draft: QuotationDraft, totals: CalcResult): QuotationDocument {
  const blank = (v: string | null | undefined) => (v ? v : null);
  return {
    ...base,
    quotation: {
      ...base.quotation,
      title: draft.title,
      issue_date: draft.issue_date ?? null,
      valid_until: draft.valid_until ?? null,
      discount_type: draft.discount_type,
      discount_value_minor: draft.discount_value_minor,
      discount_bp: draft.discount_bp,
      tax_name: blank(draft.tax_name),
      tax_rate_bp: draft.tax_rate_bp,
      subtotal_minor: totals.subtotal_minor,
      discount_minor: totals.discount_minor,
      taxable_minor: totals.taxable_minor,
      tax_minor: totals.tax_minor,
      total_minor: totals.total_minor,
      notes: blank(draft.notes),
      terms: draft.terms.filter(Boolean),
      items: draft.items.map((item, position) => ({
        id: `draft-${position}`,
        position,
        service_id: item.service_id ?? null,
        name: item.name,
        description: blank(item.description),
        pricing_model: item.pricing_model,
        quantity: item.quantity,
        unit: blank(item.unit),
        rate_minor: item.rate_minor,
        percent_bp: item.percent_bp,
        amount_minor: totals.item_amounts_minor[position] ?? 0,
      })),
      scope: {
        overview: blank(draft.scope.overview),
        deliverables: draft.scope.deliverables.filter(Boolean),
        included: draft.scope.included.filter(Boolean),
        excluded: draft.scope.excluded.filter(Boolean),
        assumptions: draft.scope.assumptions.filter(Boolean),
        revision_policy: blank(draft.scope.revision_policy),
      },
      milestones: draft.milestones.map((m, position) => ({
        id: `draft-${position}`,
        position,
        name: m.name,
        description: blank(m.description),
        start_label: blank(m.start_label),
        end_label: blank(m.end_label),
      })),
    },
  };
}
