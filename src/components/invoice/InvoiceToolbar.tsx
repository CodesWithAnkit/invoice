"use client";

import { useInvoicePrint } from "@/hooks/useInvoicePrint";

export default function InvoiceToolbar() {
  const { printInvoice } = useInvoicePrint();

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
