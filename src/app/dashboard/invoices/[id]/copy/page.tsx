"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchInvoiceBundle } from "@/modules/invoice/invoice.api";
import { useInvoice } from "@/hooks/useInvoice";

import InvoicePrintLayout from "@/components/invoice/InvoicePrintLayout";
import InvoicePreviewModal from "@/components/invoice/InvoicePreviewModal";
import InvoiceWorkspaceShell from "@/components/invoice/InvoiceWorkspaceShell";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CopyInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { setInvoiceData } = useInvoice();
  const [loading, setLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (params?.id) {
      loadInvoiceData(params.id as string);
    }
  }, [params?.id]);

  const loadInvoiceData = async (id: string) => {
    try {
      // Invoice, customer and items from the business-scoped API
      const { invoice: invoiceData, customer: customerData, items: itemsData } =
        await fetchInvoiceBundle(id);

      // Preload state into useInvoice hook BUT WITHOUT THE ID
      setInvoiceData({
        id: undefined, // IMPORTANT: Clear ID to ensure it creates a new record on save
        businessName: invoiceData.business_name || "",
        businessAddress: invoiceData.business_address || "",
        phone: invoiceData.business_phone || "",
        gstin: invoiceData.business_gstin || "",
        meta: {
          invoiceNumber: "", // Clear invoice number for the duplicate
          date: new Date().toISOString().split("T")[0],
          type: invoiceData.invoice_type || "invoice",
        },
        customer: {
          name: customerData?.name || invoiceData.customer_name,
          address: customerData?.address || "",
          fields: {
            phone: customerData?.phone || "",
            aadhaar: customerData?.aadhaar || "",
            companyName: customerData?.company_name || "",
          },
        },
        items: itemsData?.map((item: any) => ({
          id: crypto.randomUUID(), // New IDs for items
          description: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total,
        })) || [],
        bank: {
          bankName: invoiceData.bank_name || "",
          accountName: invoiceData.account_name || "",
          accountNumber: invoiceData.account_number || "",
          ifsc: invoiceData.ifsc || "",
        },
      });

    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Failed to copy invoice data.");
      router.push("/dashboard/invoices");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <InvoicePrintLayout />

      <InvoiceWorkspaceShell
        title="Duplicate Invoice"
        description="A new copy of the invoice. Change details as needed and save."
        onOpenPreview={() => setIsPreviewOpen(true)}
      />

      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </div>
  );
}
