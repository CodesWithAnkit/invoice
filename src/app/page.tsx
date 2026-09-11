"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InvoiceEditor from "@/components/invoice/InvoiceEditor";
import InvoiceToolbar from "@/components/invoice/InvoiceToolbar";
import InvoicePrintLayout from "@/components/invoice/InvoicePrintLayout";
import InvoicePreviewModal from "@/components/invoice/InvoicePreviewModal";
import InvoiceLiveSummary from "@/components/invoice/InvoiceLiveSummary";
import { PageHeader } from "@/components/PageHeader";
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

      <div className="no-print sticky top-14 lg:top-15 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 bg-background/95 backdrop-blur border-b border-border py-4 [&>div]:mb-0">
        <PageHeader
          title="Invoice Editor"
          description="Build a new invoice or quote from scratch."
          action={<InvoiceToolbar onOpenPreview={() => setIsPreviewOpen(true)} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start pt-4">
        <div className="xl:col-span-2 no-print min-w-0">
          <InvoiceEditor />
        </div>
        <div className="xl:sticky xl:top-40">
          <InvoiceLiveSummary />
        </div>
      </div>

      {/* Preview Modal */}
      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </div>
  );
}
