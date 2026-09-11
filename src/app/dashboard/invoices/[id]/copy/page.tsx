"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/../lib/supabase";
import { useInvoice } from "@/hooks/useInvoice";

import InvoiceEditor from "@/components/invoice/InvoiceEditor";
import InvoiceToolbar from "@/components/invoice/InvoiceToolbar";
import InvoicePrintLayout from "@/components/invoice/InvoicePrintLayout";
import InvoicePreviewModal from "@/components/invoice/InvoicePreviewModal";
import InvoiceLiveSummary from "@/components/invoice/InvoiceLiveSummary";
import { PageHeader } from "@/components/PageHeader";
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
      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();
      if (invoiceError) throw invoiceError;

      // Fetch customer
      let customerData = null;
      if (invoiceData.customer_id) {
        const { data: cData } = await supabase
          .from("customers")
          .select("*")
          .eq("id", invoiceData.customer_id)
          .single();
        customerData = cData;
      }

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id);
      if (itemsError) throw itemsError;

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

      <div className="no-print sticky top-14 lg:top-15 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 bg-background/95 backdrop-blur border-b border-border py-4 [&>div]:mb-0">
        <PageHeader
          title="Duplicate Invoice"
          description="A new copy of the invoice. Change details as needed and save."
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

      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </div>
  );
}
