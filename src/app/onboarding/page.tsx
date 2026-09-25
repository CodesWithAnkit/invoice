"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BusinessDetails from "@/components/form/BusinessDetails";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [values, setValues] = useState({
    businessName: "",
    businessAddress: "",
    phone: "",
    gstin: "",
    fields: {} as Record<string, string>,
  });

  useEffect(() => {
    async function loadBusiness() {
      try {
        const res = await fetch("/api/business");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const biz = data.data;
            setValues({
              businessName: biz.name === "My business" ? "" : biz.name,
              businessAddress: biz.address || "",
              phone: biz.phone || "",
              gstin: biz.tax_id || "",
              fields: {},
            });
            // Optionally map extra fields if needed, but omitted for simplicity
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBusiness();
  }, []);

  const handleUpdate = (field: string, value: any) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const handleSave = async () => {
    if (!values.businessName.trim()) {
      setError("Business Name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.businessName,
          address: values.businessAddress,
          phone: values.phone,
          tax_id: values.gstin,
          // mapping any custom fields logic could go here
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to update business.");
      } else {
        router.push("/dashboard/overview");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard/overview");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Set up your Business</h1>
          <p className="text-muted-foreground">
            Provide your business details to personalize your invoices and quotations.
          </p>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        <BusinessDetails
          businessName={values.businessName}
          businessAddress={values.businessAddress}
          phone={values.phone}
          gstin={values.gstin}
          fields={values.fields}
          onUpdate={handleUpdate}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={handleSkip} disabled={saving}>
            Skip for now
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save and Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
