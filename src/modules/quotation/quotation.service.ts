import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateQuotation, toQuantityMilli } from "./quotation.calculator";
import type { QuotationDraft } from "./quotation.schema";
import { buildDocument, logoUrl, type QuotationDocument } from "./quotation.document";
import type {
  CatalogOption,
  QuotationActivityRecord,
  QuotationListRow,
  QuotationRecord,
  QuotationScopeRecord,
  QuotationStatus,
  QuotationTotals,
} from "./quotation.types";

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

/** Rebuilds a saveable draft from a stored quotation (used by duplicate). */
export function recordToDraft(record: QuotationRecord): QuotationDraft {
  return {
    title: record.title,
    issue_date: record.issue_date,
    valid_until: record.valid_until,
    discount_type: record.discount_type,
    discount_value_minor: record.discount_value_minor,
    discount_bp: record.discount_bp,
    tax_name: record.tax_name,
    tax_rate_bp: record.tax_rate_bp,
    notes: record.notes,
    internal_notes: record.internal_notes,
    terms: record.terms,
    items: record.items.map((item) => ({
      service_id: item.service_id,
      name: item.name,
      description: item.description,
      pricing_model: item.pricing_model,
      quantity: Number(item.quantity),
      unit: item.unit,
      rate_minor: item.rate_minor,
      percent_bp: item.percent_bp,
    })),
    scope: record.scope,
    milestones: record.milestones.map((m) => ({
      name: m.name,
      description: m.description,
      start_label: m.start_label,
      end_label: m.end_label,
    })),
  };
}

/** Builds the client-facing document from current data (drafts, and the send snapshot). */
export async function buildLiveDocument(
  supabase: SupabaseClient,
  businessId: string,
  record: QuotationRecord
): Promise<QuotationDocument> {
  const [business, customer, project] = await Promise.all([
    supabase
      .from("businesses")
      .select("name, email, phone, address, website, tax_id, logo_path")
      .eq("id", businessId)
      .single(),
    record.customer_id
      ? supabase
          .from("customers")
          .select("name, company_name, email, phone, address, tax_id")
          .eq("id", record.customer_id)
          .eq("business_id", businessId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("projects")
      .select("name, description")
      .eq("id", record.project_id)
      .eq("business_id", businessId)
      .maybeSingle(),
  ]);
  if (business.error) throw business.error;
  if (customer.error) throw customer.error;
  if (project.error) throw project.error;

  const b = business.data;
  return buildDocument(
    record,
    {
      name: b.name ?? "",
      email: b.email ?? null,
      phone: b.phone ?? null,
      address: b.address ?? null,
      website: b.website ?? null,
      tax_id: b.tax_id ?? null,
      logo_url: logoUrl(b.logo_path),
    },
    customer.data
      ? {
          name: customer.data.name,
          company_name: customer.data.company_name ?? null,
          email: customer.data.email ?? null,
          phone: customer.data.phone ?? null,
          address: customer.data.address ?? null,
          tax_id: customer.data.tax_id ?? null,
        }
      : null,
    project.data ? { name: project.data.name, description: project.data.description ?? null } : null
  );
}

/**
 * What the preview and PDF show: the frozen snapshot of the current version once
 * sent (AC-DATA-002/003, AC-PREVIEW-002), otherwise the live draft.
 */
export async function getQuotationDocument(
  supabase: SupabaseClient,
  businessId: string,
  record: QuotationRecord
): Promise<{ document: QuotationDocument; source: "snapshot" | "live" }> {
  if (record.status !== "Draft") {
    const { data, error } = await supabase
      .from("quotation_versions")
      .select("snapshot")
      .eq("quotation_id", record.id)
      .eq("business_id", businessId)
      .eq("version", record.current_version)
      .maybeSingle();
    if (error) throw error;
    if (data) return { document: data.snapshot as QuotationDocument, source: "snapshot" };
  }
  return { document: await buildLiveDocument(supabase, businessId, record), source: "live" };
}

export async function listActivity(
  supabase: SupabaseClient,
  businessId: string,
  quotationId: string
): Promise<QuotationActivityRecord[]> {
  const { data, error } = await supabase
    .from("quotation_activity")
    .select("id, type, actor, version, payload, created_at")
    .eq("quotation_id", quotationId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as QuotationActivityRecord[];
}

// Characters with meaning in PostgREST filter syntax.
const FILTER_SYNTAX = /[%*,()\\]/g;

export async function listQuotations(
  supabase: SupabaseClient,
  businessId: string,
  filters: { search?: string; status?: QuotationStatus; projectId?: string }
): Promise<QuotationListRow[]> {
  let query = supabase
    .from("quotations")
    .select(
      "id, quote_number, title, status, total_minor, currency, valid_until, updated_at, project:projects ( id, name ), customer:customers ( id, name )"
    )
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  const search = (filters.search ?? "").replace(FILTER_SYNTAX, " ").trim();
  if (search) query = query.or(`title.ilike.%${search}%,quote_number.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as QuotationListRow[];
}
