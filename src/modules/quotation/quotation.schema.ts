import { z } from "zod";
import { BP_SCALE, DISCOUNT_TYPES, PRICING_MODELS, QUANTITY_SCALE } from "./quotation.calculator";

// Single validation source for /api/quotations and the estimate builder
// (AC-CALC-005). Totals are never accepted from the client: unknown keys such
// as `total_minor` are stripped and recomputed server-side (AC-CALC-004).

/**
 * One-page content caps (R-15a). Provisional values chosen so the compact
 * one-page layout has room for every section; Phase 6 confirms them with the
 * measured one-page Playwright test and may tighten them.
 */
export const QUOTATION_CAPS = {
  titleChars: 100,
  items: 10,
  itemNameChars: 80,
  itemDescriptionChars: 160,
  unitChars: 20,
  overviewChars: 500,
  bulletsPerList: 5,
  bulletChars: 120,
  revisionPolicyChars: 300,
  milestones: 5,
  milestoneNameChars: 60,
  milestoneDescriptionChars: 120,
  milestoneLabelChars: 30,
  terms: 5,
  termChars: 160,
  notesChars: 500,
  internalNotesChars: 2000,
  taxNameChars: 30,
} as const;

export const MAX_QUANTITY = 1_000_000;
/** ₹1,000 crore in paise: far beyond any real quotation, well inside safe integers. */
export const MAX_MINOR = 1_000_000_000_000;

const minor = (label: string) =>
  z
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number of minor units`)
    .min(0, `${label} cannot be negative`)
    .max(MAX_MINOR, `${label} is too large`);

const bp = (label: string) =>
  z
    .number({ error: `${label} must be a number` })
    .int(`${label} can have at most 2 decimal places`)
    .min(0, `${label} cannot be negative`)
    .max(BP_SCALE, `${label} cannot exceed 100%`);

const text = (max: number, label: string) => z.string().trim().max(max, `${label} is limited to ${max} characters`);
const optionalText = (max: number, label: string) => text(max, label).nullable().optional();

const bulletList = (label: string) =>
  z
    .array(text(QUOTATION_CAPS.bulletChars, `Each ${label} item`))
    .max(QUOTATION_CAPS.bulletsPerList, `${label} is limited to ${QUOTATION_CAPS.bulletsPerList} items`)
    .default([]);

const isoDate = z.iso.date("Use a valid date (YYYY-MM-DD)").nullable().optional();

export const QuotationItemSchema = z.object({
  service_id: z.uuid("Invalid catalog item").nullable().optional(),
  name: text(QUOTATION_CAPS.itemNameChars, "Item name"),
  description: optionalText(QUOTATION_CAPS.itemDescriptionChars, "Item description"),
  pricing_model: z.enum(PRICING_MODELS, { error: "Choose a pricing model" }),
  quantity: z
    .number({ error: "Quantity must be a number" })
    .gt(0, "Quantity must be greater than 0")
    .max(MAX_QUANTITY, "Quantity is too large")
    .refine(
      (q) => Math.abs(Math.round(q * QUANTITY_SCALE) - q * QUANTITY_SCALE) < 1e-6,
      "Quantity can have at most 3 decimal places"
    ),
  unit: optionalText(QUOTATION_CAPS.unitChars, "Unit"),
  rate_minor: minor("Rate"),
  percent_bp: bp("Percentage"),
});

export const QuotationScopeSchema = z.object({
  overview: optionalText(QUOTATION_CAPS.overviewChars, "Overview"),
  deliverables: bulletList("Deliverables"),
  included: bulletList("Included"),
  excluded: bulletList("Excluded"),
  assumptions: bulletList("Assumptions"),
  revision_policy: optionalText(QUOTATION_CAPS.revisionPolicyChars, "Revision policy"),
});

export const QuotationMilestoneSchema = z.object({
  name: text(QUOTATION_CAPS.milestoneNameChars, "Milestone name"),
  description: optionalText(QUOTATION_CAPS.milestoneDescriptionChars, "Milestone description"),
  start_label: optionalText(QUOTATION_CAPS.milestoneLabelChars, "Milestone start"),
  end_label: optionalText(QUOTATION_CAPS.milestoneLabelChars, "Milestone end"),
});

/** PATCH /api/quotations/:id — the whole draft (header + children) is replaced atomically. */
export const QuotationDraftSchema = z
  .object({
    title: text(QUOTATION_CAPS.titleChars, "Title"),
    issue_date: isoDate,
    valid_until: isoDate,
    discount_type: z.enum(DISCOUNT_TYPES, { error: "Choose a discount type" }),
    discount_value_minor: minor("Discount"),
    discount_bp: bp("Discount"),
    tax_name: optionalText(QUOTATION_CAPS.taxNameChars, "Tax name"),
    tax_rate_bp: bp("Tax rate"),
    notes: optionalText(QUOTATION_CAPS.notesChars, "Notes"),
    internal_notes: optionalText(QUOTATION_CAPS.internalNotesChars, "Internal notes"),
    terms: z
      .array(text(QUOTATION_CAPS.termChars, "Each term"))
      .max(QUOTATION_CAPS.terms, `Terms are limited to ${QUOTATION_CAPS.terms} items`)
      .default([]),
    items: z
      .array(QuotationItemSchema)
      .max(QUOTATION_CAPS.items, `A one-page quotation holds at most ${QUOTATION_CAPS.items} line items`),
    scope: QuotationScopeSchema,
    milestones: z
      .array(QuotationMilestoneSchema)
      .max(QUOTATION_CAPS.milestones, `A one-page quotation holds at most ${QUOTATION_CAPS.milestones} milestones`),
  })
  .refine((q) => !q.issue_date || !q.valid_until || q.valid_until >= q.issue_date, {
    message: "Valid until must be on or after the issue date",
    path: ["valid_until"],
  });

export type QuotationDraft = z.infer<typeof QuotationDraftSchema>;
export type QuotationItemInput = z.infer<typeof QuotationItemSchema>;

export const CreateQuotationSchema = z.object({
  project_id: z.uuid("A valid project is required"),
});

/** Readable "items.2.rate_minor" → "Item 3: Rate cannot be negative" for API errors. */
export function describeIssue(issue: z.core.$ZodIssue): string {
  const [head, index] = issue.path;
  if (head === "items" && typeof index === "number") return `Item ${index + 1}: ${issue.message}`;
  if (head === "milestones" && typeof index === "number") return `Milestone ${index + 1}: ${issue.message}`;
  return issue.message;
}
