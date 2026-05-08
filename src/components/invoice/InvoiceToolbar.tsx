"use client";

import { useInvoicePrint } from "@/hooks/useInvoicePrint";
import { useInvoice } from "@/hooks/useInvoice";
import { useState } from "react";

export default function InvoiceToolbar() {
  const { printInvoice } = useInvoicePrint();
  const { invoice } = useInvoice();
  const [saving, setSaving] = useState(false);

  const handleSaveToDashboard = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append(
        "customer",
        JSON.stringify({
          name: invoice.customer.name || invoice.businessName,
          address: invoice.customer.address,
          phone: invoice.phone,
        })
      );
      formData.append(
        "invoice",
        JSON.stringify({
          invoice_number: invoice.meta.invoiceNumber,
          invoice_type: invoice.meta.type,
          subtotal: invoice.totals.subTotal,
          sgst: invoice.totals.sgst,
          cgst: invoice.totals.cgst,
          total: invoice.totals.grandTotal,
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

      alert("Invoice saved to dashboard successfully!");
    } catch (error) {
      console.error(error);
      alert("Error saving invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="no-print" style={{ 
      display: "flex", 
      gap: "12px", 
      padding: "16px", 
      backgroundColor: "#1e293b", 
      borderRadius: "12px", 
      marginBottom: "20px",
      alignItems: "center",
      justifyContent: "space-between",
      color: "white"
    }}>
      <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>Actions</div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button 
          onClick={handleSaveToDashboard}
          disabled={saving}
          style={{
            padding: "8px 16px",
            backgroundColor: saving ? "#64748b" : "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "600",
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => !saving && (e.currentTarget.style.backgroundColor = "#d97706")}
          onMouseOut={(e) => !saving && (e.currentTarget.style.backgroundColor = "#f59e0b")}
        >
          {saving ? "Saving..." : "Save to DB"}
        </button>
        <button 
          onClick={printInvoice}
          style={{
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "0.9rem",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#3b82f6"}
        >
          Print Invoice (A4)
        </button>
        <button 
          onClick={printInvoice} // For now, print handles PDF via browser
          style={{
            padding: "8px 16px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "0.9rem",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#059669"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#10b981"}
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}
