"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/../lib/supabase";
import { useInvoice } from "@/hooks/useInvoice";

import InvoiceEditor from "@/components/invoice/InvoiceEditor";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import InvoiceToolbar from "@/components/invoice/InvoiceToolbar";
import InvoicePrintLayout from "@/components/invoice/InvoicePrintLayout";
import { PageHeader } from "@/components/PageHeader";
import { Loader2 } from "lucide-react";

export default function CopyInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { setInvoiceData } = useInvoice();
  const [loading, setLoading] = useState(true);

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
          },
        },
        items: itemsData?.map((item: any) => ({
          id: crypto.randomUUID(), // New IDs for items
          description: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total,
        })) || [],
      });

    } catch (error) {
      console.error("Error loading invoice:", error);
      alert("Failed to copy invoice data.");
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
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto w-full">
      <InvoicePrintLayout />

      <PageHeader
        title="Duplicate Invoice"
        description="A new copy of the invoice. Change details as needed and save."
      />

      <InvoiceToolbar />

      <div className="flex flex-wrap items-start gap-8">
        <div className="no-print flex-1 min-w-[350px]">
          <InvoiceEditor />
        </div>
        <div className="no-print flex-1 min-w-[350px] sticky top-24">
          <InvoicePreview />
        </div>
      </div>
    </div>
  );
}
