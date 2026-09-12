"use client";

import { useInvoicePrint } from "@/hooks/useInvoicePrint";
import { useInvoice } from "@/hooks/useInvoice";
import { useInvoiceTemplate } from "@/hooks/useInvoiceTemplate";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

interface InvoiceToolbarProps {
  onOpenPreview: () => void;
}

export default function InvoiceToolbar({ onOpenPreview }: InvoiceToolbarProps) {
  const { printInvoice } = useInvoicePrint();
  const { invoice, generateInvoice } = useInvoice();
  const { template, changeTemplate } = useInvoiceTemplate();
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
    <div className="no-print flex flex-wrap gap-2 items-center">
      {/* Template toggle pill */}
      <div
        style={{
          display: "flex",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          overflow: "hidden",
          fontSize: "0.78rem",
          fontWeight: 500,
        }}
      >
        {(["classic", "modern"] as const).map((t) => (
          <button
            key={t}
            onClick={() => changeTemplate(t)}
            style={{
              padding: "5px 14px",
              cursor: "pointer",
              border: "none",
              borderRight: t === "classic" ? "1px solid #d1d5db" : undefined,
              backgroundColor: template === t ? "#1b3a6b" : "#fff",
              color: template === t ? "#fff" : "#374151",
              transition: "background 0.15s, color 0.15s",
              textTransform: "capitalize",
            }}
          >
            {t === "classic" ? "Classic" : "Modern"}
          </button>
        ))}
      </div>
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
        className="text-sm bg-success hover:bg-success/90 text-success-foreground"
      >
        {saving ? "Saving..." : "Save to DB"}
      </Button>
      <Button
        onClick={printInvoice}
        className="text-sm"
      >
        Print / PDF
      </Button>
    </div>
  );
}
