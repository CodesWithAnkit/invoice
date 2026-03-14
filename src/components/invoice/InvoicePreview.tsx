"use client";

import InvoiceTemplate from "../InvoiceTemplate";

export default function InvoicePreview() {
  return (
    <div className="invoice-screen-preview" style={{ padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
      <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "#1e293b" }}>Invoice Preview</h3>
      <InvoiceTemplate />
    </div>
  );
}
