"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";

const QuotationSchema = z.object({
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
  default_validity_days: z.preprocess((val) => Number(val), z.number().int().min(1)),
  default_tax_name: z.string().optional(),
  default_tax_rate_bp: z.preprocess((val) => val === "" ? undefined : Number(val), z.number().int().min(0).max(10000).optional()),
  quote_prefix: z.string().optional(),
  default_notes: z.string().optional(),
  allow_client_pdf_download: z.boolean().default(true),
});

type FormValues = z.infer<typeof QuotationSchema>;

export function QuotationSettingsPanel({ initialData }: { initialData: any }) {
  const [values, setValues] = useState<any>({
    currency: initialData?.currency || "USD",
    timezone: initialData?.timezone || "UTC",
    default_validity_days: initialData?.default_validity_days?.toString() || "30",
    default_tax_name: initialData?.default_tax_name || "",
    default_tax_rate_bp: initialData?.default_tax_rate_bp?.toString() || "",
    quote_prefix: initialData?.quote_prefix || "QT-",
    default_notes: initialData?.default_notes || "",
    allow_client_pdf_download: initialData?.allow_client_pdf_download ?? true,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setValues({
        currency: initialData.currency || "USD",
        timezone: initialData.timezone || "UTC",
        default_validity_days: initialData.default_validity_days?.toString() || "30",
        default_tax_name: initialData.default_tax_name || "",
        default_tax_rate_bp: initialData.default_tax_rate_bp?.toString() || "",
        quote_prefix: initialData.quote_prefix || "QT-",
        default_notes: initialData.default_notes || "",
        allow_client_pdf_download: initialData.allow_client_pdf_download ?? true,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setValues((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      setValues((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validated = QuotationSchema.safeParse(values);
    if (!validated.success) {
      const formattedErrors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        formattedErrors[issue.path[0] as keyof FormValues] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update quotation settings");

      toast.success("Quotation settings updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground">Quotation Settings</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Configure defaults for new quotations and invoices.
      </p>

      <div className="border-t border-border my-5" />

      <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Currency (Code) *" error={errors.currency}>
            {(field) => (
              <Input {...field} name="currency" placeholder="USD, EUR, INR" value={values.currency} onChange={handleChange} />
            )}
          </FormField>
          
          <FormField label="Timezone *" error={errors.timezone}>
            {(field) => (
              <Input {...field} name="timezone" placeholder="America/New_York" value={values.timezone} onChange={handleChange} />
            )}
          </FormField>

          <FormField label="Default Validity (Days) *" error={errors.default_validity_days}>
            {(field) => (
              <Input {...field} name="default_validity_days" type="number" value={values.default_validity_days} onChange={handleChange} />
            )}
          </FormField>
          
          <FormField label="Quote Number Prefix" error={errors.quote_prefix}>
            {(field) => (
              <Input {...field} name="quote_prefix" placeholder="QT-" value={values.quote_prefix} onChange={handleChange} />
            )}
          </FormField>

          <FormField label="Default Tax Name" error={errors.default_tax_name}>
            {(field) => (
              <Input {...field} name="default_tax_name" placeholder="e.g. VAT, GST" value={values.default_tax_name} onChange={handleChange} />
            )}
          </FormField>

          <FormField label="Default Tax Rate (Basis Points, 100 = 1%)" error={errors.default_tax_rate_bp}>
            {(field) => (
              <Input {...field} name="default_tax_rate_bp" type="number" value={values.default_tax_rate_bp} onChange={handleChange} />
            )}
          </FormField>
        </div>

        <FormField label="Default Notes (Appears on bottom of quotes/invoices)" error={errors.default_notes}>
          {(field) => (
            <Textarea {...field} name="default_notes" rows={4} value={values.default_notes} onChange={handleChange} />
          )}
        </FormField>

        <div className="flex items-center space-x-2 pt-2">
          <input 
            type="checkbox" 
            id="allow_client_pdf_download" 
            name="allow_client_pdf_download" 
            checked={values.allow_client_pdf_download} 
            onChange={handleChange} 
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="allow_client_pdf_download" className="text-sm font-medium">Allow clients to download Quotations/Invoices as PDF</label>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
