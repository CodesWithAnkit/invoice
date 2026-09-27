import type { DiscountType, PricingModel } from "./quotation.calculator";

export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";

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
