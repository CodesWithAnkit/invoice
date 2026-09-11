"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/../lib/supabase";
import { ArrowLeft, Download, FileEdit, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export default function InvoiceDetail() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchInvoiceDetails(params.id as string);
    }
  }, [params?.id]);

  const fetchInvoiceDetails = async (id: string) => {
    setLoading(true);
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();
      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      if (invoiceData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", invoiceData.customer_id)
          .single();
        if (customerError) throw customerError;
        setCustomer(customerData);
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id);
      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-foreground">
        <h2 className="text-xl font-bold mb-4">Invoice Not Found</h2>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  // No audit/event backend exists yet — derive a minimal, honest timeline
  // from real timestamps/fields instead of fabricating unrelated events.
  // See context/redesign_implementation_plan.md Phase 4.
  const auditEvents = [
    invoice.pdf_url && {
      title: "Invoice Transmitted",
      timestamp: invoice.created_at,
      description: "PDF generated and stored for this invoice.",
      icon: Send,
    },
    {
      title: "Invoice Recorded",
      timestamp: invoice.created_at,
      description: "Invoice and line items saved to the ledger.",
      icon: CheckCircle2,
    },
  ].filter(Boolean) as { title: string; timestamp: string; description: string; icon: typeof Send }[];

  const status = invoice.pdf_url ? "RECONCILED" : "DRAFT";

  return (
    <div className="w-full">
      <Link
        href="/dashboard/invoices"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Invoices
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">{invoice.customer_name}</h1>
                <p className="text-sm text-muted-foreground font-mono">
                  {invoice.invoice_number} (Issued {format(new Date(invoice.created_at), "MMM dd, yyyy")})
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={status} />
                {invoice.pdf_url && (
                  <Button asChild variant="outline">
                    <a href={invoice.pdf_url} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Issuer Profile
              </p>
              <p className="font-semibold text-foreground">{invoice.business_name || "—"}</p>
              {invoice.business_phone && (
                <p className="text-sm text-muted-foreground mt-1">{invoice.business_phone}</p>
              )}
              {invoice.business_gstin && (
                <p className="text-sm text-muted-foreground font-mono mt-1">GSTIN: {invoice.business_gstin}</p>
              )}
              {invoice.business_address && (
                <p className="text-sm text-muted-foreground mt-1">{invoice.business_address}</p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Client Profile
              </p>
              <p className="font-semibold text-foreground">{customer?.name || invoice.customer_name}</p>
              {customer?.phone && <p className="text-sm text-muted-foreground mt-1">{customer.phone}</p>}
              {customer?.aadhaar && (
                <p className="text-sm text-muted-foreground font-mono mt-1">Aadhaar: {customer.aadhaar}</p>
              )}
              {customer?.address && <p className="text-sm text-muted-foreground mt-1">{customer.address}</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr className="text-muted-foreground">
                  <th className="py-3 px-5 font-medium">Itemised description</th>
                  <th className="py-3 px-5 font-medium text-right">Qty</th>
                  <th className="py-3 px-5 font-medium text-right">Rate</th>
                  <th className="py-3 px-5 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-5 text-foreground">{item.product_name}</td>
                    <td className="py-3 px-5 text-right font-mono text-muted-foreground">{item.quantity}</td>
                    <td className="py-3 px-5 text-right font-mono text-muted-foreground">
                      ₹{item.unit_price?.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-semibold text-foreground">
                      ₹{item.total?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full sm:w-80 rounded-xl border border-border bg-card p-5 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">₹{invoice.subtotal?.toLocaleString() || "0.00"}</span>
              </div>
              {(invoice.cgst > 0 || invoice.sgst > 0) && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>CGST</span>
                    <span className="font-mono">₹{invoice.cgst?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>SGST</span>
                    <span className="font-mono">₹{invoice.sgst?.toLocaleString()}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
                <span>Total Due</span>
                <span className="font-mono">₹{invoice.total?.toLocaleString() || "0.00"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 h-fit">
          <p className="font-semibold text-foreground">Audit Log &amp; Timeline</p>
          <p className="text-xs text-muted-foreground mb-4">Events recorded for this invoice</p>
          <div className="space-y-4">
            {auditEvents.map((event, i) => (
              <div key={i} className="flex gap-3">
                <event.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {format(new Date(event.timestamp), "MMM dd, yyyy - h:mm a")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
