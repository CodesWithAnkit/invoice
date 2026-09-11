"use client";

import InvoiceTemplate from "../InvoiceTemplate";

export default function InvoicePreview() {
  return (
    <div className="invoice-screen-preview" style={{ padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
      <InvoiceTemplate />
    </div>
  );
}
