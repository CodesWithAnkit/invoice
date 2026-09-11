"use client";

import { useInvoice } from "@/hooks/useInvoice";

// Real-time totals sidebar for the invoice workspace pages — mirrors the
// totals already computed by useInvoice()/ItemTable, just surfaced as an
// always-visible summary alongside the form. Purely additive, no new logic.
export default function InvoiceLiveSummary() {
  const { invoice } = useInvoice();
  const { subTotal, sgst, cgst, grandTotal } = invoice.totals;

  return (
    <div className="no-print rounded-xl border border-border bg-card p-5">
      <p className="font-semibold text-foreground mb-4">Realtime Calculation Audit</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-mono">₹{subTotal.toLocaleString()}</span>
        </div>
        {sgst > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>SGST</span>
            <span className="font-mono">₹{sgst.toLocaleString()}</span>
          </div>
        )}
        {cgst > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>CGST</span>
            <span className="font-mono">₹{cgst.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
          <span>Net Amount</span>
          <span className="font-mono text-primary">₹{grandTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
