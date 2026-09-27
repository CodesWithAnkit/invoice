import type { DiscountType, PricingModel } from "./quotation.calculator";

export const QUOTATION_STATUSES = ["Draft", "Sent", "Viewed", "Accepted", "Rejected", "Expired", "Archived"] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export type QuotationItemRecord = {
  id: string;
  position: number;
  service_id: string | null;
  name: string;
  description: string | null;
  pricing_model: PricingModel;
  quantity: number;
  unit: string | null;
  rate_minor: number;
  percent_bp: number;
  amount_minor: number;
};

export type QuotationScopeRecord = {
  overview: string | null;
  deliverables: string[];
  included: string[];
  excluded: string[];
  assumptions: string[];
  revision_policy: string | null;
};

export type QuotationMilestoneRecord = {
  id: string;
  position: number;
  name: string;
  description: string | null;
  start_label: string | null;
  end_label: string | null;
};

export type QuotationTotals = {
  subtotal_minor: number;
  discount_minor: number;
  taxable_minor: number;
  tax_minor: number;
  total_minor: number;
};

/** The full quotation aggregate returned by GET/PATCH /api/quotations/:id. */
export type QuotationRecord = QuotationTotals & {
  id: string;
  project_id: string;
  customer_id: string | null;
  status: QuotationStatus;
  title: string;
  issue_date: string | null;
  valid_until: string | null;
  currency: string;
  current_version: number;
  /** Assigned at send (R-13); null while never sent. */
  quote_number: string | null;
  /** Public link token (R-17); owner-only, created at first send. */
  public_token: string | null;
  sent_at: string | null;
  discount_type: DiscountType;
  discount_value_minor: number;
  discount_bp: number;
  tax_name: string | null;
  tax_rate_bp: number;
  notes: string | null;
  internal_notes: string | null;
  terms: string[];
  created_at: string;
  updated_at: string;
  project: { id: string; name: string } | null;
  customer: { id: string; name: string } | null;
  items: QuotationItemRecord[];
  scope: QuotationScopeRecord;
  milestones: QuotationMilestoneRecord[];
};

/** A catalog entry offered in the builder's "Select product/service" picker. */
export type CatalogOption = {
  id: string;
  name: string;
  pricing_model: PricingModel;
  unit: string | null;
  default_rate_minor: number | null;
  default_percent_bp: number | null;
};

export type QuotationActivityType =
  | "created"
  | "updated"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired"
  | "revised"
  | "archived"
  | "duplicated"
  | "link_regenerated";

export type QuotationActivityRecord = {
  id: string;
  type: QuotationActivityType;
  actor: "owner" | "client" | "system";
  version: number | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type QuotationListRow = {
  id: string;
  quote_number: string | null;
  title: string;
  status: QuotationStatus;
  total_minor: number;
  currency: string;
  valid_until: string | null;
  updated_at: string;
  project: { id: string; name: string } | null;
  customer: { id: string; name: string } | null;
};
