"use client";

import InvoiceForm from "../InvoiceForm";

export default function InvoiceEditor() {
  return (
    <div className="no-print rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
      <h3 className="mb-6 mt-0 border-b pb-2 text-lg font-semibold tracking-tight">
        Invoice Editor
      </h3>
      <InvoiceForm />
    </div>
  );
}
