"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";

const ProfileSchema = z.object({
  name: z.string().min(1, "Company Name is required"),
  email: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.union([z.string().url("Invalid URL"), z.literal("")]).optional(),
  tax_id: z.string().optional(),
  logo_path: z.string().optional(),
});

type FormValues = z.infer<typeof ProfileSchema>;

export function CompanyProfilePanel({ initialData }: { initialData: any }) {
  const [values, setValues] = useState<FormValues>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    website: initialData?.website || "",
    tax_id: initialData?.tax_id || "",
    logo_path: initialData?.logo_path || "",
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [saving, setSaving] = useState(false);

  // Sync if initialData changes after mount
  useEffect(() => {
    if (initialData) {
      setValues({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        website: initialData.website || "",
        tax_id: initialData.tax_id || "",
        logo_path: initialData.logo_path || "",
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validated = ProfileSchema.safeParse(values);
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
      if (!data.success) throw new Error(data.error || "Failed to update profile");

      toast.success("Company profile updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground">Company Profile</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Update your business details and contact information.
      </p>

      <div className="border-t border-border my-5" />

      <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Company Name *" error={errors.name}>
            {(field) => (
              <Input {...field} name="name" value={values.name} onChange={handleChange} />
            )}
          </FormField>
          
          <FormField label="Tax ID" error={errors.tax_id}>
            {(field) => (
              <Input {...field} name="tax_id" value={values.tax_id} onChange={handleChange} />
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

          <div className="md:col-span-2">
            <FormField label="Website" error={errors.website}>
              {(field) => (
                <Input {...field} name="website" type="url" value={values.website} onChange={handleChange} placeholder="https://example.com" />
              )}
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="Address" error={errors.address}>
              {(field) => (
                <Textarea {...field} name="address" rows={3} value={values.address} onChange={handleChange} />
              )}
            </FormField>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
