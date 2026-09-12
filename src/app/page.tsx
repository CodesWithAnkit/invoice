"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InvoicePrintLayout from "@/components/invoice/InvoicePrintLayout";
import InvoicePreviewModal from "@/components/invoice/InvoicePreviewModal";
import InvoiceWorkspaceShell from "@/components/invoice/InvoiceWorkspaceShell";
import { useInvoice } from "@/hooks/useInvoice";

export default function Home() {
  const router = useRouter();
  const { resetInvoice } = useInvoice();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("invoice_auth");
    if (!auth) {
      router.push("/login");
    } else {
      setIsAuthorized(true);
      resetInvoice();
    }
  }, [router, resetInvoice]);

  if (!isAuthorized) {
    return null; // Or a loading spinner
  }

  return (
    <div className="w-full">
      {/* Global Print Layout (Hidden on screen via styles/invoice-print.css) */}
      <InvoicePrintLayout />

      <InvoiceWorkspaceShell
        title="Invoice Editor"
        description="Build a new invoice or quote from scratch."
        onOpenPreview={() => setIsPreviewOpen(true)}
      />

      {/* Preview Modal */}
      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </div>
  );
}
