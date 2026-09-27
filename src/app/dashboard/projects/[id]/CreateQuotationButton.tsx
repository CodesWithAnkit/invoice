"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

// AC-ESTIMATE-001: start a draft quotation for this project and open the builder.
export function CreateQuotationButton({ projectId, disabled }: { projectId: string; disabled?: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const create = async () => {
    setCreating(true);
    try {
      const { id } = await apiFetch<{ id: string }>("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });
      router.push(`/dashboard/quotations/${id}/edit`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the quotation");
      setCreating(false);
    }
  };

  return (
    <Button size="sm" onClick={create} disabled={disabled || creating} id="create-quotation-btn">
      <FilePlus2 className="mr-2 h-4 w-4" />
      {creating ? "Creating…" : "Create quotation"}
    </Button>
  );
}
