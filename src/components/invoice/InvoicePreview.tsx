"use client";

import InvoiceTemplate from "../InvoiceTemplate";

export default function InvoicePreview() {
  return (
    <div className="invoice-screen-preview p-5 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col items-center justify-center">
      <InvoiceTemplate />
    </div>
  );
}
