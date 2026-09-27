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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CopyInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { setInvoiceData } = useInvoice();
  const [loading, setLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [pendingInvoiceData, setPendingInvoiceData] = useState<any>(null);

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
      setPendingInvoiceData({
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
          name: customerData?.name || invoiceData.customer_name || "",
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

      setCustomerName(customerData?.name || invoiceData.customer_name || "");
      setShowCustomerPopup(true);

    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Failed to copy invoice data.");
      router.push("/dashboard/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerConfirm = () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    
    // Set the data with the potentially updated customer name
    const updatedData = { ...pendingInvoiceData };
    if (updatedData.customer.name !== customerName) {
      updatedData.customer.name = customerName;
      // If they changed the name, we should clear the other customer fields 
      // so it creates a fresh customer properly instead of mixing data
      updatedData.customer.address = "";
      updatedData.customer.fields = { phone: "", aadhaar: "", companyName: "" };
    }
    
    setInvoiceData(updatedData);
    setShowCustomerPopup(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If the popup is open, we shouldn't render the Workspace shell yet because
  // useInvoice data isn't set. 
  if (showCustomerPopup) {
    return (
      <Dialog open={true} onOpenChange={() => {}}> 
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Document</DialogTitle>
            <DialogDescription>
              Who is this new document for?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="customer-name" className="text-sm font-medium mb-2 block">
              Customer Name
            </label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Acme Corp"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCustomerConfirm();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button onClick={handleCustomerConfirm}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
