"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, CloudUpload, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { BulletListEditor } from "@/components/quotation/BulletListEditor";
import { CurrencyInput, PercentageInput } from "@/components/quotation/FinancialInputs";
import { EstimateLineItem } from "@/components/quotation/EstimateLineItem";
import { MilestoneEditor } from "@/components/quotation/MilestoneEditor";
import { QuoteSummary } from "@/components/quotation/QuoteSummary";
import { useQuotationDraft, type SaveStatus } from "@/hooks/useQuotationDraft";
import type { DiscountType } from "@/modules/quotation/quotation.calculator";
import type { ScopeListKey } from "@/modules/quotation/quotation.form";
import { formatBp, formatMinor } from "@/modules/quotation/quotation.money";
import { QUOTATION_CAPS } from "@/modules/quotation/quotation.schema";
import type { CatalogOption, QuotationRecord } from "@/modules/quotation/quotation.types";
import { cn } from "@/lib/utils";

// DS §31–35 Estimate Builder: header → line items → discount/tax/total →
// scope → timeline, with a sticky live summary. Drafts auto-save (AC-QUOTE-001).

const SCOPE_LISTS: { key: ScopeListKey; label: string; placeholder: string }[] = [
  { key: "deliverables", label: "Deliverables", placeholder: "e.g. Responsive website" },
  { key: "included", label: "Included", placeholder: "e.g. 2 revision rounds" },
  { key: "excluded", label: "Excluded", placeholder: "e.g. Content writing" },
  { key: "assumptions", label: "Assumptions", placeholder: "e.g. Client provides brand assets" },
];

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function SaveIndicator({ status, error }: { status: SaveStatus; error: string | null }) {
  const content: Record<SaveStatus, { icon: React.ReactNode; text: string }> = {
    saved: { icon: <CheckCircle2 className="h-4 w-4 text-success" />, text: "All changes saved" },
    unsaved: { icon: <CloudUpload className="h-4 w-4 text-muted-foreground" />, text: "Unsaved changes" },
    saving: { icon: <CloudUpload className="h-4 w-4 animate-pulse text-muted-foreground" />, text: "Saving…" },
    invalid: { icon: <AlertTriangle className="h-4 w-4 text-warning" />, text: "Fix the highlighted fields to save" },
    error: { icon: <AlertTriangle className="h-4 w-4 text-destructive" />, text: error ?? "Could not save" },
  };
  const { icon, text } = content[status];
  return (
    <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-sm text-muted-foreground" data-testid="save-status">
      {icon}
      <span>{text}</span>
    </p>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5" aria-labelledby={`section-${title}`}>
      <div className="border-b border-border pb-2">
        <h2 id={`section-${title}`} className="font-semibold text-foreground">
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function CapMeter({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono">
          {used}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className={cn("h-full rounded-full", used > max ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function EstimateBuilder({ quotation, catalog }: { quotation: QuotationRecord; catalog: CatalogOption[] }) {
  const draft = useQuotationDraft(quotation);
  const { values, errors, preview, calcError, parsedDraft } = draft;
  const currency = quotation.currency;

  // While inputs are invalid, keep showing the last server-confirmed totals.
  const totals = preview ?? draft.serverTotals;
  const discountError = errors["discount"] ?? (calcError?.startsWith("Discount") ? calcError : undefined);

  const bulletCount = SCOPE_LISTS.reduce((sum, l) => sum + values.scope[l.key].length, 0);
  const fitsOnePage =
    values.items.length <= QUOTATION_CAPS.items &&
    values.milestones.length <= QUOTATION_CAPS.milestones &&
    SCOPE_LISTS.every((l) => values.scope[l.key].length <= QUOTATION_CAPS.bulletsPerList) &&
    values.terms.length <= QUOTATION_CAPS.terms &&
    values.scope.overview.length <= QUOTATION_CAPS.overviewChars;

  const onText =
    (name: "title" | "issue_date" | "valid_until" | "tax_name" | "tax_rate" | "discount_value" | "discount_percent" | "notes" | "internal_notes") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      draft.setField(name, e.target.value);

  const discountLabel =
    parsedDraft?.discount_type === "percent" ? formatBp(parsedDraft.discount_bp) : undefined;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Link
            href={`/dashboard/projects/${quotation.project_id}`}
            className="mb-4 inline-flex items-center text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {quotation.project?.name ?? "project"}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Estimate builder</h1>
            <StatusBadge status={quotation.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {quotation.customer?.name ?? "No customer"} · {quotation.project?.name ?? "No project"} · {currency}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <SaveIndicator status={draft.status} error={draft.saveError} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void draft.saveNow()}
            disabled={draft.status === "saving" || draft.status === "saved"}
          >
            Save now
          </Button>
        </div>
      </div>

      {/* Mobile: total stays reachable (DS §34) */}
      <div className="sticky top-14 z-30 flex items-center justify-between rounded-lg border border-border bg-card/95 px-4 py-2 shadow-sm backdrop-blur lg:hidden">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="font-mono text-base font-bold tabular-nums text-primary" data-testid="mobile-total">
          {formatMinor(totals.total_minor, currency)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Section title="Quotation details">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Title" error={errors["title"]} className="md:col-span-2">
                {(field) => (
                  <Input {...field} value={values.title} maxLength={QUOTATION_CAPS.titleChars} onChange={onText("title")} />
                )}
              </FormField>
              <FormField label="Issue date" error={errors["issue_date"]}>
                {(field) => <Input {...field} type="date" value={values.issue_date} onChange={onText("issue_date")} />}
              </FormField>
              <FormField label="Valid until" error={errors["valid_until"]}>
                {(field) => <Input {...field} type="date" value={values.valid_until} onChange={onText("valid_until")} />}
              </FormField>
            </div>
          </Section>

          <Section
            title="Line items"
            description={`Amounts are calculated from quantity × rate. Up to ${QUOTATION_CAPS.items} items fit on the one-page quotation.`}
          >
            {values.items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No line items yet. Add a product or service to start the estimate.
              </p>
            ) : (
              <ul className="space-y-3">
                {values.items.map((item, i) => (
                  <EstimateLineItem
                    key={item.key}
                    item={item}
                    index={i}
                    count={values.items.length}
                    currency={currency}
                    amountMinor={preview ? preview.item_amounts_minor[i] : null}
                    errors={errors}
                    catalog={catalog}
                    onChange={(patch) => draft.updateItem(i, patch)}
                    onMove={(to) => draft.moveItem(i, to)}
                    onRemove={() => draft.removeItem(i)}
                  />
                ))}
              </ul>
            )}
            {errors["items"] && <p className="text-body-sm font-medium text-foreground">{errors["items"]}</p>}
            <Button type="button" variant="outline" onClick={draft.addItem} disabled={values.items.length >= QUOTATION_CAPS.items}>
              <Plus className="mr-2 h-4 w-4" />
              {values.items.length >= QUOTATION_CAPS.items ? `Limit of ${QUOTATION_CAPS.items} items reached` : "Add item"}
            </Button>
          </Section>

          <Section title="Discount & tax" description="One quotation-level discount and one tax rate (R-05, R-07).">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Discount type">
                {(field) => (
                  <select
                    {...field}
                    className={selectClass}
                    value={values.discount_type}
                    onChange={(e) => draft.setField("discount_type", e.target.value as DiscountType)}
                  >
                    <option value="none">No discount</option>
                    <option value="fixed">Fixed amount</option>
                    <option value="percent">Percentage</option>
                  </select>
                )}
              </FormField>
              {values.discount_type === "fixed" && (
                <FormField label="Discount amount" error={discountError}>
                  {(field) => (
                    <CurrencyInput {...field} currency={currency} value={values.discount_value} onChange={onText("discount_value")} />
                  )}
                </FormField>
              )}
              {values.discount_type === "percent" && (
                <FormField label="Discount percentage" error={discountError}>
                  {(field) => <PercentageInput {...field} value={values.discount_percent} onChange={onText("discount_percent")} />}
                </FormField>
              )}
              {values.discount_type === "none" && <div className="hidden md:block" />}
              <FormField label="Tax name" error={errors["tax_name"]} help="e.g. GST">
                {(field) => (
                  <Input {...field} value={values.tax_name} maxLength={QUOTATION_CAPS.taxNameChars} onChange={onText("tax_name")} />
                )}
              </FormField>
              <FormField label="Tax rate" error={errors["tax_rate"]}>
                {(field) => <PercentageInput {...field} value={values.tax_rate} onChange={onText("tax_rate")} />}
              </FormField>
            </div>
            {calcError && !discountError && <p className="text-body-sm font-medium text-foreground">{calcError}</p>}
          </Section>

          <Section title="Scope" description="Keep it short: every section prints on the one-page quotation.">
            <FormField label="Project overview" error={errors["scope.overview"]} help={`${values.scope.overview.length}/${QUOTATION_CAPS.overviewChars} characters`}>
              {(field) => (
                <Textarea
                  {...field}
                  rows={4}
                  maxLength={QUOTATION_CAPS.overviewChars}
                  value={values.scope.overview}
                  onChange={(e) => draft.setScopeText("overview", e.target.value)}
                />
              )}
            </FormField>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {SCOPE_LISTS.map((list) => (
                <BulletListEditor
                  key={list.key}
                  label={list.label}
                  items={values.scope[list.key]}
                  max={QUOTATION_CAPS.bulletsPerList}
                  maxChars={QUOTATION_CAPS.bulletChars}
                  placeholder={list.placeholder}
                  error={errors[`scope.${list.key}`]}
                  onChange={(items) => draft.setScopeList(list.key, items)}
                />
              ))}
            </div>
            <FormField label="Revision policy" error={errors["scope.revision_policy"]}>
              {(field) => (
                <Textarea
                  {...field}
                  rows={2}
                  maxLength={QUOTATION_CAPS.revisionPolicyChars}
                  value={values.scope.revision_policy}
                  onChange={(e) => draft.setScopeText("revision_policy", e.target.value)}
                />
              )}
            </FormField>
          </Section>

          <Section title="Timeline" description="Milestones with a date or a relative period (e.g. Week 1–2).">
            <MilestoneEditor
              milestones={values.milestones}
              errors={errors}
              onChange={draft.updateMilestone}
              onAdd={draft.addMilestone}
              onRemove={draft.removeMilestone}
              onMove={draft.moveMilestone}
            />
          </Section>

          <Section title="Terms & notes">
            <BulletListEditor
              label="Terms"
              items={values.terms}
              max={QUOTATION_CAPS.terms}
              maxChars={QUOTATION_CAPS.termChars}
              placeholder="e.g. 50% advance, balance on delivery"
              error={errors["terms"]}
              onChange={(terms) => draft.setField("terms", terms)}
            />
            <FormField label="Notes for the client" error={errors["notes"]}>
              {(field) => (
                <Textarea {...field} rows={3} maxLength={QUOTATION_CAPS.notesChars} value={values.notes} onChange={onText("notes")} />
              )}
            </FormField>
            <FormField label="Internal notes" error={errors["internal_notes"]} help="Never shown to the client.">
              {(field) => (
                <Textarea
                  {...field}
                  rows={2}
                  maxLength={QUOTATION_CAPS.internalNotesChars}
                  value={values.internal_notes}
                  onChange={onText("internal_notes")}
                />
              )}
            </FormField>
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Estimate summary">
          <QuoteSummary
            totals={totals}
            currency={currency}
            taxName={values.tax_name}
            taxRateBp={parsedDraft?.tax_rate_bp ?? quotation.tax_rate_bp}
            discountLabel={discountLabel}
          />
          <section className="space-y-3 rounded-xl border border-border bg-card p-5" aria-label="One-page check">
            <p className={cn("flex items-center gap-1.5 text-sm font-semibold", fitsOnePage ? "text-foreground" : "text-destructive")} data-testid="one-page-status">
              {fitsOnePage ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4" />}
              {fitsOnePage ? "Fits on one page" : "Too long for one page"}
            </p>
            <CapMeter label="Line items" used={values.items.length} max={QUOTATION_CAPS.items} />
            <CapMeter label="Milestones" used={values.milestones.length} max={QUOTATION_CAPS.milestones} />
            <CapMeter label="Scope bullets" used={bulletCount} max={QUOTATION_CAPS.bulletsPerList * SCOPE_LISTS.length} />
            <CapMeter label="Terms" used={values.terms.length} max={QUOTATION_CAPS.terms} />
          </section>
        </aside>
      </div>
    </div>
  );
}
