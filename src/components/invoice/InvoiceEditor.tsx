"use client";

import InvoiceForm from "../InvoiceForm";

export default function InvoiceEditor() {
  return (
    <div className="no-print" style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
      <h3 style={{ marginTop: 0, marginBottom: "1.5rem", color: "#1e293b", borderBottom: "2px solid #f1f5f9", paddingBottom: "0.5rem" }}>
        Invoice Editor
      </h3>
      <InvoiceForm />
    </div>
  );
}
