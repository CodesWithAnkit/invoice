"use client";

import { useEffect, useState } from "react";
import InvoicePrintLayout from "@/components/invoice/InvoicePrintLayout";
import InvoicePreviewModal from "@/components/invoice/InvoicePreviewModal";
import InvoiceWorkspaceShell from "@/components/invoice/InvoiceWorkspaceShell";
import { useInvoice } from "@/hooks/useInvoice";

export default function Home() {
  const { resetInvoice } = useInvoice();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    resetInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
