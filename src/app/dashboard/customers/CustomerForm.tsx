"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface CustomerFormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  tax_id: string;
  company_name: string;
  status: "active" | "archived";
}

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
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = customerId ? `/api/customers/${customerId}` : "/api/customers";
      const method = customerId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Name *</label>
          <Input id="name" name="name" required value={values.name} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" name="email" type="email" value={values.email} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">Phone</label>
          <Input id="phone" name="phone" value={values.phone} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <label htmlFor="company_name" className="text-sm font-medium">Company Name</label>
          <Input id="company_name" name="company_name" value={values.company_name} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <label htmlFor="tax_id" className="text-sm font-medium">Tax ID</label>
          <Input id="tax_id" name="tax_id" value={values.tax_id} onChange={handleChange} />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="address" className="text-sm font-medium">Address</label>
        <Textarea id="address" name="address" rows={3} value={values.address} onChange={handleChange} />
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">Notes</label>
        <Textarea id="notes" name="notes" rows={2} value={values.notes} onChange={handleChange} />
      </div>

      {customerId && (
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">Status</label>
          <select
            id="status"
            name="status"
            value={values.status}
            onChange={handleChange}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
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
          {saving ? "Saving..." : "Save Customer"}
        </Button>
      </div>
    </form>
  );
}
