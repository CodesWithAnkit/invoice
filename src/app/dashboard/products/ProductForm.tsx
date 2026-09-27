"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

const ProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  kind: z.enum(["product", "service"]).default("product"),
  pricing_model: z.enum(["fixed", "hourly", "daily", "quantity", "percentage"]).default("fixed"),
  unit: z.string().optional(),
  default_rate_minor: z.string().optional(),
  default_percent_bp: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof ProductSchema>;

type FieldErrors = {
  [K in keyof ProductFormValues]?: string;
};

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>;
  productId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ initialValues, productId, onSuccess, onCancel }: ProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({
    name: initialValues?.name || "",
    kind: initialValues?.kind || "product",
    pricing_model: initialValues?.pricing_model || "fixed",
    unit: initialValues?.unit || "",
    default_rate_minor: initialValues?.default_rate_minor || "",
    default_percent_bp: initialValues?.default_percent_bp || "",
    is_active: initialValues?.is_active ?? true,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setValues((prev) => ({ ...prev, [name]: checked }));
    } else {
      setValues((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validated = ProductSchema.safeParse(values);
    if (!validated.success) {
      const formattedErrors: FieldErrors = {};
      validated.error.issues.forEach(issue => {
        formattedErrors[issue.path[0] as keyof ProductFormValues] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setSaving(true);
    try {
      const url = productId ? `/api/products/${productId}` : "/api/products";
      const method = productId ? "PATCH" : "POST";

      const payload = {
        ...validated.data,
        default_rate_minor: validated.data.default_rate_minor ? parseInt(validated.data.default_rate_minor, 10) : null,
        default_percent_bp: validated.data.default_percent_bp ? parseInt(validated.data.default_percent_bp, 10) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save item");

      toast.success(`${values.kind === "service" ? "Service" : "Product"} ${productId ? "updated" : "created"} successfully`);
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <FormField label="Name *" error={errors.name}>
            {(field) => (
              <Input {...field} name="name" value={values.name} onChange={handleChange} />
            )}
          </FormField>
        </div>

        <FormField label="Kind" error={errors.kind}>
          {(field) => (
            <select
              {...field}
              name="kind"
              value={values.kind}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="product">Product</option>
              <option value="service">Service</option>
            </select>
          )}
        </FormField>

        <FormField label="Pricing Model" error={errors.pricing_model}>
          {(field) => (
            <select
              {...field}
              name="pricing_model"
              value={values.pricing_model}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="quantity">Quantity</option>
              <option value="percentage">Percentage</option>
            </select>
          )}
        </FormField>

        {values.pricing_model !== "percentage" && (
          <FormField label="Rate (in cents/paise)" error={errors.default_rate_minor}>
            {(field) => (
              <Input 
                {...field}
                name="default_rate_minor" 
                type="number"
                value={values.default_rate_minor} 
                onChange={handleChange} 
              />
            )}
          </FormField>
        )}

        {values.pricing_model === "percentage" && (
          <FormField label="Percent (Basis Points)" error={errors.default_percent_bp}>
            {(field) => (
              <Input 
                {...field}
                name="default_percent_bp" 
                type="number"
                value={values.default_percent_bp} 
                onChange={handleChange} 
              />
            )}
          </FormField>
        )}

        <FormField label="Unit" error={errors.unit}>
          {(field) => (
            <Input 
              {...field}
              name="unit" 
              placeholder="e.g. hours, items" 
              value={values.unit} 
              onChange={handleChange} 
            />
          )}
        </FormField>
      </div>

      {productId && (
        <div className="flex items-center space-x-2 pt-2">
          <input 
            type="checkbox" 
            id="is_active" 
            name="is_active" 
            checked={values.is_active} 
            onChange={handleChange} 
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="is_active" className="text-sm font-medium">Active (appears in new invoices/quotations)</label>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => (onCancel ? onCancel() : router.back())} 
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
