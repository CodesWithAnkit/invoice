"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";

const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  customer_id: z.string().uuid("Please select a customer"),
  description: z.string().optional(),
  notes: z.string().optional(),
  start_date: z.string().optional(),
  expected_end_date: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof ProjectSchema>;

type FieldErrors = { [K in keyof ProjectFormValues]?: string };

interface CustomerOption {
  id: string;
  name: string;
}

interface ProjectFormProps {
  initialValues?: Partial<ProjectFormValues>;
  projectId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({ initialValues, projectId, onSuccess, onCancel }: ProjectFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProjectFormValues>({
    name: initialValues?.name || "",
    customer_id: initialValues?.customer_id || "",
    description: initialValues?.description || "",
    notes: initialValues?.notes || "",
    start_date: initialValues?.start_date || "",
    expected_end_date: initialValues?.expected_end_date || "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch("/api/customers");
        const data = await res.json();
        if (data.success) {
          setCustomers(
            (data.data.customers as { id: string; name: string }[]).map((c) => ({
              id: c.id,
              name: c.name,
            }))
          );
        }
      } catch {
        toast.error("Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCustomers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validated = ProjectSchema.safeParse(values);
    if (!validated.success) {
      const formattedErrors: FieldErrors = {};
      validated.error.issues.forEach((issue) => {
        formattedErrors[issue.path[0] as keyof ProjectFormValues] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setSaving(true);
    try {
      const url = projectId ? `/api/projects/${projectId}` : "/api/projects";
      const method = projectId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save project");

      toast.success(`Project ${projectId ? "updated" : "created"} successfully`);
      router.refresh();
      if (onSuccess) {
        onSuccess();
      } else if (!projectId) {
        router.push(`/dashboard/projects/${data.data.id}`);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <FormField label="Project Name *" error={errors.name}>
            {(field) => (
              <Input {...field} name="name" value={values.name} onChange={handleChange} />
            )}
          </FormField>
        </div>

        <div className="md:col-span-2">
          <FormField label="Customer *" error={errors.customer_id}>
            {(field) => (
              <select
                {...field}
                name="customer_id"
                value={values.customer_id}
                onChange={handleChange}
                disabled={loadingCustomers}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="">
                  {loadingCustomers ? "Loading customers..." : "Select a customer"}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        </div>

        <FormField label="Start Date" error={errors.start_date}>
          {(field) => (
            <Input {...field} name="start_date" type="date" value={values.start_date} onChange={handleChange} />
          )}
        </FormField>

        <FormField label="Expected End Date" error={errors.expected_end_date}>
          {(field) => (
            <Input
              {...field}
              name="expected_end_date"
              type="date"
              value={values.expected_end_date}
              onChange={handleChange}
            />
          )}
        </FormField>
      </div>

      <FormField label="Description" error={errors.description}>
        {(field) => (
          <Textarea
            {...field}
            name="description"
            rows={3}
            value={values.description}
            onChange={handleChange}
            placeholder="Brief overview of the project scope…"
          />
        )}
      </FormField>

      <FormField label="Internal Notes" error={errors.notes}>
        {(field) => (
          <Textarea
            {...field}
            name="notes"
            rows={2}
            value={values.notes}
            onChange={handleChange}
            placeholder="Internal notes not visible to the client…"
          />
        )}
      </FormField>

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
          {saving ? "Saving..." : projectId ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
