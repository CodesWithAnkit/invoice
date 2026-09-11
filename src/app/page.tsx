"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InvoiceEditor from "@/components/invoice/InvoiceEditor";
import InvoiceToolbar from "@/components/invoice/InvoiceToolbar";
import InvoicePrintLayout from "@/components/invoice/InvoicePrintLayout";
import InvoicePreviewModal from "@/components/invoice/InvoicePreviewModal";
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* 1. Global Print Layout (Hidden on screen via styles/invoice-print.css) */}
      <InvoicePrintLayout />

      {/* 2. Editor Header (Screen only) */}
      <header className="no-print mb-6 border-b pb-4">
        <h1 className="m-0 text-foreground text-2xl font-bold tracking-tight">Invoice Editor</h1>
      </header>

      {/* 3. Global Toolbar (Screen only) */}
      <InvoiceToolbar onOpenPreview={() => setIsPreviewOpen(true)} />

      {/* Editor Column (Screen only) */}
      <div className="no-print">
        <InvoiceEditor />
      </div>

      {/* Preview Modal */}
      <InvoicePreviewModal 
        isOpen={isPreviewOpen} 
        onOpenChange={setIsPreviewOpen} 
      />
    </div>
  );
}
