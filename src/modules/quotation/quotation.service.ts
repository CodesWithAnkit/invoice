import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateQuotation, toQuantityMilli } from "./quotation.calculator";
import type { QuotationDraft } from "./quotation.schema";
import type { CatalogOption, QuotationRecord, QuotationScopeRecord, QuotationTotals } from "./quotation.types";

// Server-only data access for quotations. Callers pass the per-request client
// from requireBusiness(), so RLS applies as a second wall behind businessId.

const EMPTY_SCOPE: QuotationScopeRecord = {
  overview: null,
  deliverables: [],
  included: [],
  excluded: [],
  assumptions: [],
  revision_policy: null,
};

const QUOTATION_SELECT = `
  *,
  project:projects ( id, name ),
  customer:customers ( id, name ),
  items:quotation_items ( id, position, service_id, name, description, pricing_model, quantity, unit, rate_minor, percent_bp, amount_minor ),
  scope:quotation_scope ( overview, deliverables, included, excluded, assumptions, revision_policy ),
  milestones:quotation_milestones ( id, position, name, description, start_label, end_label )
`;

/** Returns the quotation aggregate, or null when it doesn't exist for this business. */
export async function getQuotation(
  supabase: SupabaseClient,
  businessId: string,
  id: string
): Promise<QuotationRecord | null> {
  const { data, error } = await supabase
    .from("quotations")
    .select(QUOTATION_SELECT)
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { scope, items, milestones, terms, ...rest } = data;
  delete rest.business_id;
  const scopeRow = Array.isArray(scope) ? scope[0] : scope;
  return {
    ...rest,
    terms: Array.isArray(terms) ? terms.filter((t: unknown): t is string => typeof t === "string") : [],
    items: [...(items ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({ ...item, quantity: Number(item.quantity) })),
    milestones: [...(milestones ?? [])].sort((a, b) => a.position - b.position),
    scope: scopeRow ?? EMPTY_SCOPE,
  } as QuotationRecord;
}

/** Recomputes every amount from the validated draft (AC-CALC-004). Throws QuotationCalcError. */
export function computeDraft(draft: QuotationDraft) {
  const result = calculateQuotation({
    items: draft.items.map((item) => ({
      pricing_model: item.pricing_model,
      quantity_milli: item.pricing_model === "percentage" ? 1000 : toQuantityMilli(item.quantity),
      rate_minor: item.rate_minor,
      percent_bp: item.percent_bp,
    })),
    discount_type: draft.discount_type,
    discount_value_minor: draft.discount_value_minor,
    discount_bp: draft.discount_bp,
    tax_rate_bp: draft.tax_rate_bp,
  });
  const totals: QuotationTotals = {
    subtotal_minor: result.subtotal_minor,
    discount_minor: result.discount_minor,
    taxable_minor: result.taxable_minor,
    tax_minor: result.tax_minor,
    total_minor: result.total_minor,
  };
  return { totals, itemAmounts: result.item_amounts_minor };
}

/** Writes header, items, scope and milestones in one transaction (save_quotation_draft). */
export async function saveDraft(supabase: SupabaseClient, id: string, draft: QuotationDraft) {
  const { totals, itemAmounts } = computeDraft(draft);
  const blank = (value: string | null | undefined) => (value ? value : null);

  const { error } = await supabase.rpc("save_quotation_draft", {
    p_quotation_id: id,
    p_header: {
      title: draft.title,
      issue_date: draft.issue_date ?? null,
      valid_until: draft.valid_until ?? null,
      discount_type: draft.discount_type,
      // Only the active discount input is kept, so a stale value can't resurface.
      discount_value_minor: draft.discount_type === "fixed" ? draft.discount_value_minor : 0,
      discount_bp: draft.discount_type === "percent" ? draft.discount_bp : 0,
      tax_name: blank(draft.tax_name),
      tax_rate_bp: draft.tax_rate_bp,
      notes: blank(draft.notes),
      internal_notes: blank(draft.internal_notes),
      terms: draft.terms.filter(Boolean),
      ...totals,
    },
    p_items: draft.items.map((item, position) => ({
      position,
      service_id: item.service_id ?? null,
      name: item.name,
      description: blank(item.description),
      pricing_model: item.pricing_model,
      quantity: item.pricing_model === "percentage" ? 1 : item.quantity,
      unit: blank(item.unit),
      rate_minor: item.pricing_model === "percentage" ? 0 : item.rate_minor,
      percent_bp: item.pricing_model === "percentage" ? item.percent_bp : 0,
      amount_minor: itemAmounts[position],
    })),
    p_scope: {
      overview: blank(draft.scope.overview),
      deliverables: draft.scope.deliverables.filter(Boolean),
      included: draft.scope.included.filter(Boolean),
      excluded: draft.scope.excluded.filter(Boolean),
      assumptions: draft.scope.assumptions.filter(Boolean),
      revision_policy: blank(draft.scope.revision_policy),
    },
    p_milestones: draft.milestones.map((m, position) => ({
      position,
      name: m.name,
      description: blank(m.description),
      start_label: blank(m.start_label),
      end_label: blank(m.end_label),
    })),
  });
  if (error) throw error;
}

/** Active catalog entries for the builder's picker. */
export async function listCatalogOptions(supabase: SupabaseClient, businessId: string): Promise<CatalogOption[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, pricing_model, unit, default_rate_minor, default_percent_bp")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CatalogOption[];
}

/** Today's date (YYYY-MM-DD) in the business time zone (R-14). */
export function todayInZone(timeZone: string, offsetDays = 0): string {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
      date
    );
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
