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
import { toast } from "sonner";

export default function EditInvoicePage() {
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

      // Preload state into useInvoice hook
      setInvoiceData({
        id: invoiceData.id,
        businessName: invoiceData.business_name || "",
        businessAddress: invoiceData.business_address || "",
        phone: invoiceData.business_phone || "",
        gstin: invoiceData.business_gstin || "",
        meta: {
          invoiceNumber: invoiceData.invoice_number,
          date: new Date(invoiceData.created_at).toISOString().split("T")[0],
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
          id: item.id || crypto.randomUUID(),
          description: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total,
        })) || [],
      });

    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Failed to load invoice data.");
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
        title="Edit Invoice"
        description="Update invoice details and save changes."
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
