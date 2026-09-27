"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";

const CustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  tax_id: z.string().optional(),
  company_name: z.string().optional(),
  status: z.enum(["active", "archived"]).default("active"),
});

export type CustomerFormValues = z.infer<typeof CustomerSchema>;

type FieldErrors = {
  [K in keyof CustomerFormValues]?: string;
};

interface CustomerFormProps {
  initialValues?: Partial<CustomerFormValues>;
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CustomerForm({ initialValues, customerId, onSuccess, onCancel }: CustomerFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CustomerFormValues>({
    name: initialValues?.name || "",
    email: initialValues?.email || "",
    phone: initialValues?.phone || "",
    address: initialValues?.address || "",
    notes: initialValues?.notes || "",
    tax_id: initialValues?.tax_id || "",
    company_name: initialValues?.company_name || "",
    status: initialValues?.status || "active",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validated = CustomerSchema.safeParse(values);
    if (!validated.success) {
      const formattedErrors: FieldErrors = {};
      validated.error.issues.forEach(issue => {
        formattedErrors[issue.path[0] as keyof CustomerFormValues] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setSaving(true);
    try {
      const url = customerId ? `/api/customers/${customerId}` : "/api/customers";
      const method = customerId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save customer");

      toast.success(`Customer ${customerId ? "updated" : "created"} successfully`);
      router.refresh();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/customers");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name *" error={errors.name}>
          {(field) => (
            <Input {...field} name="name" value={values.name} onChange={handleChange} />
          )}
        </FormField>
        <FormField label="Email" error={errors.email}>
          {(field) => (
            <Input {...field} name="email" type="email" value={values.email} onChange={handleChange} />
          )}
        </FormField>
        <FormField label="Phone" error={errors.phone}>
          {(field) => (
            <Input {...field} name="phone" value={values.phone} onChange={handleChange} />
          )}
        </FormField>
        <FormField label="Company Name" error={errors.company_name}>
          {(field) => (
            <Input {...field} name="company_name" value={values.company_name} onChange={handleChange} />
          )}
        </FormField>
        <FormField label="Tax ID" error={errors.tax_id}>
          {(field) => (
            <Input {...field} name="tax_id" value={values.tax_id} onChange={handleChange} />
          )}
        </FormField>
      </div>

      <FormField label="Address" error={errors.address}>
        {(field) => (
          <Textarea {...field} name="address" rows={3} value={values.address} onChange={handleChange} />
        )}
      </FormField>

      <FormField label="Notes" error={errors.notes}>
        {(field) => (
          <Textarea {...field} name="notes" rows={2} value={values.notes} onChange={handleChange} />
        )}
      </FormField>

      {customerId && (
        <FormField label="Status" error={errors.status}>
          {(field) => (
            <select
              {...field}
              name="status"
              value={values.status}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          )}
        </FormField>
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
          {saving ? "Saving..." : "Save Customer"}
        </Button>
      </div>
    </form>
  );
}
