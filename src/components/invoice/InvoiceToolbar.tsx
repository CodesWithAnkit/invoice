"use client";

import { useInvoicePrint } from "@/hooks/useInvoicePrint";
import { useInvoice } from "@/hooks/useInvoice";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

interface InvoiceToolbarProps {
  onOpenPreview: () => void;
}

export default function InvoiceToolbar({ onOpenPreview }: InvoiceToolbarProps) {
  const { printInvoice } = useInvoicePrint();
  const { invoice, generateInvoice } = useInvoice();
  const [saving, setSaving] = useState(false);

  const handleSaveToDashboard = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append(
        "customer",
        JSON.stringify({
          name: invoice.customer.name,
          address: invoice.customer.address,
          phone: invoice.customer.fields?.phone || "",
          aadhaar: invoice.customer.fields?.aadhaar || "",
          companyName: invoice.customer.fields?.companyName || "",
        })
      );
      formData.append(
        "invoice",
        JSON.stringify({
          id: invoice.id,
          invoice_number: invoice.meta.invoiceNumber,
          invoice_type: invoice.meta.type,
          subtotal: invoice.totals.subTotal,
          sgst: invoice.totals.sgst,
          cgst: invoice.totals.cgst,
          total: invoice.totals.grandTotal,
          business_name: invoice.businessName,
          business_address: invoice.businessAddress,
          business_phone: invoice.phone,
          business_gstin: invoice.gstin,
          bank: invoice.bank,
        })
      );
      formData.append(
        "items",
        JSON.stringify(
          invoice.items.map((item) => ({
            name: item.description,
            quantity: item.quantity,
            price: item.unitPrice,
          }))
        )
      );
      // NOTE: Intentionally not sending PDF file since user requested no changes to PDF printing system.

      const res = await fetch("/api/invoices/save", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to save invoice");
      }

      toast.success("Invoice saved to dashboard successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error saving invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="no-print sticky top-0 z-50 flex items-center justify-between gap-3 p-4 bg-card border shadow-sm mb-5 text-card-foreground rounded-lg">
      <div className="font-semibold text-sm">Actions</div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={generateInvoice}
          variant="secondary"
          className="text-sm"
        >
          Force Recalculate
        </Button>
        <Button
          onClick={onOpenPreview}
          variant="outline"
          className="text-sm"
        >
          Preview
        </Button>
        <Button
          onClick={handleSaveToDashboard}
          disabled={saving}
          className="text-sm bg-amber-500 hover:bg-amber-600 text-primary-foreground"
        >
          {saving ? "Saving..." : "Save to DB"}
        </Button>
        <Button
          onClick={printInvoice}
          className="text-sm bg-blue-500 hover:bg-blue-600 text-primary-foreground"
        >
          Print / PDF
        </Button>
      </div>
    </div>
  );
}
