"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CurrencyInput, PercentageInput, QuantityInput } from "@/components/quotation/FinancialInputs";
import { PRICING_MODELS, type PricingModel } from "@/modules/quotation/quotation.calculator";
import type { FormErrors, ItemFormValues } from "@/modules/quotation/quotation.form";
import { bpToInput, formatMinor, minorToInput } from "@/modules/quotation/quotation.money";
import { QUOTATION_CAPS } from "@/modules/quotation/quotation.schema";
import type { CatalogOption } from "@/modules/quotation/quotation.types";

const MODEL_LABELS: Record<PricingModel, string> = {
  fixed: "Fixed",
  hourly: "Hourly",
  daily: "Daily",
  quantity: "Quantity",
  percentage: "Percentage",
};

const QUANTITY_LABELS: Record<PricingModel, string> = {
  fixed: "Quantity",
  hourly: "Hours",
  daily: "Days",
  quantity: "Quantity",
  percentage: "Quantity",
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring aria-invalid:border-destructive";

// DS §32: Service/Product · Description · Pricing model · Quantity · Rate ·
// Amount (calculated, never typed) · Actions.
export function EstimateLineItem({
  item,
  index,
  count,
  currency,
  amountMinor,
  errors,
  catalog,
  onChange,
  onMove,
  onRemove,
}: {
  item: ItemFormValues;
  index: number;
  count: number;
  currency: string;
  amountMinor: number | null;
  errors: FormErrors;
  catalog: CatalogOption[];
  onChange: (patch: Partial<ItemFormValues>) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const n = index + 1;
  const err = (field: string) => errors[`items.${index}.${field}`];
  const isPercent = item.pricing_model === "percentage";

  const pickCatalog = (id: string) => {
    const entry = catalog.find((c) => c.id === id);
    if (!entry) {
      onChange({ service_id: null });
      return;
    }
    // Copy the catalog defaults into the line; later catalog edits never
    // change this quotation (AC-CATALOG-003).
    onChange({
      service_id: entry.id,
      name: entry.name,
      pricing_model: entry.pricing_model,
      unit: entry.unit ?? "",
      rate: entry.default_rate_minor != null ? minorToInput(entry.default_rate_minor) : item.rate,
      percent: entry.default_percent_bp != null ? bpToInput(entry.default_percent_bp) : item.percent,
    });
  };

  return (
    <li
      className="rounded-lg border border-border bg-background p-4"
      data-testid="estimate-line-item"
      aria-label={`Line item ${n}`}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <FormField label={`Catalog item ${n}`} className="md:col-span-7">
          {(field) => (
            <select
              {...field}
              className={selectClass}
              value={item.service_id ?? ""}
              onChange={(e) => pickCatalog(e.target.value)}
            >
              <option value="">Custom item</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label={`Item ${n} pricing`} error={err("pricing_model")} className="md:col-span-5">
          {(field) => (
            <select
              {...field}
              className={selectClass}
              value={item.pricing_model}
              onChange={(e) => onChange({ pricing_model: e.target.value as PricingModel })}
            >
              {PRICING_MODELS.map((m) => (
                <option key={m} value={m}>
                  {MODEL_LABELS[m]}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label={`Item ${n} name`} error={err("name")} className="md:col-span-12">
          {(field) => (
            <Input
              {...field}
              value={item.name}
              maxLength={QUOTATION_CAPS.itemNameChars}
              placeholder="e.g. Website development"
              onChange={(e) => onChange({ name: e.target.value })}
            />
          )}
        </FormField>

        {isPercent ? (
          <FormField
            label={`Item ${n} percentage`}
            error={err("percent")}
            help="Of the non-percentage items' subtotal"
            className="md:col-span-5"
          >
            {(field) => (
              <PercentageInput {...field} value={item.percent} onChange={(e) => onChange({ percent: e.target.value })} />
            )}
          </FormField>
        ) : (
          <>
            <FormField
              label={`Item ${n} ${QUANTITY_LABELS[item.pricing_model].toLowerCase()}`}
              error={err("quantity")}
              className="md:col-span-3"
            >
              {(field) => (
                <QuantityInput {...field} value={item.quantity} onChange={(e) => onChange({ quantity: e.target.value })} />
              )}
            </FormField>
            <FormField label={`Item ${n} unit`} error={err("unit")} className="md:col-span-3">
              {(field) => (
                <Input
                  {...field}
                  value={item.unit}
                  maxLength={QUOTATION_CAPS.unitChars}
                  placeholder={item.pricing_model === "hourly" ? "hour" : item.pricing_model === "daily" ? "day" : "unit"}
                  onChange={(e) => onChange({ unit: e.target.value })}
                />
              )}
            </FormField>
            <FormField label={`Item ${n} rate`} error={err("rate")} className="md:col-span-6">
              {(field) => (
                <CurrencyInput
                  {...field}
                  currency={currency}
                  value={item.rate}
                  onChange={(e) => onChange({ rate: e.target.value })}
                />
              )}
            </FormField>
          </>
        )}

        <FormField label={`Item ${n} description`} error={err("description")} className="md:col-span-12">
          {(field) => (
            <Input
              {...field}
              value={item.description}
              maxLength={QUOTATION_CAPS.itemDescriptionChars}
              placeholder="Optional detail shown on the quotation"
              onChange={(e) => onChange({ description: e.target.value })}
            />
          )}
        </FormField>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3 md:col-span-12">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move item ${n} up`}
              disabled={index === 0}
              onClick={() => onMove(index - 1)}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move item ${n} down`}
              disabled={index === count - 1}
              onClick={() => onMove(index + 1)}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove item ${n}`} onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          {/* Calculated, never typed (DS §32). */}
          <p className="flex items-baseline gap-2 text-sm text-muted-foreground">
            Amount
            <span className="font-mono text-base font-semibold tabular-nums text-foreground" data-testid="line-amount" aria-live="polite">
              {amountMinor === null ? "—" : formatMinor(amountMinor, currency)}
            </span>
          </p>
        </div>
      </div>
    </li>
  );
}
