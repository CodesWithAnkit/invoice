"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchInvoiceBundle } from "@/modules/invoice/invoice.api";
import { useInvoice } from "@/hooks/useInvoice";
import InvoicePrintLayout from "@/components/invoice/InvoicePrintLayout";
import { ArrowLeft, Download, FileEdit, Send, CheckCircle2, CreditCard } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { useInvoiceTemplate } from "@/hooks/useInvoiceTemplate";

export default function InvoiceDetail() {
  const params = useParams();
  const router = useRouter();
  const { setInvoiceData } = useInvoice();
  const [invoice, setInvoice] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { template, changeTemplate } = useInvoiceTemplate();

  useEffect(() => {
    if (params?.id) {
      fetchInvoiceDetails(params.id as string);
    }
  }, [params?.id]);

  const fetchInvoiceDetails = async (id: string) => {
    setLoading(true);
    try {
      const { invoice: invoiceData, customer: customerData, items: itemsData } =
        await fetchInvoiceBundle(id);
      setInvoice(invoiceData);
      if (customerData) setCustomer(customerData);
      setItems(itemsData || []);

      // Preload state into useInvoice hook for print
      setInvoiceData({
        id: invoiceData.id,
        businessName: invoiceData.business_name || "",
        businessAddress: invoiceData.business_address || "",
        phone: invoiceData.business_phone || "",
        gstin: invoiceData.business_gstin || "",
        meta: {
          invoiceNumber: invoiceData.invoice_number,
          date: new Date(invoiceData.created_at).toISOString().split("T")[0],
          type: invoiceData.invoice_type || "invoice",
        },
        customer: {
          name: customerData?.name || invoiceData.customer_name,
          address: customerData?.address || "",
          fields: {
            phone: customerData?.phone || "",
            aadhaar: customerData?.aadhaar || "",
            companyName: customerData?.company_name || "",
          },
        },
        items: itemsData?.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          description: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total,
        })) || [],
        bank: {
          bankName: invoiceData.bank_name || "",
          accountName: invoiceData.account_name || "",
          accountNumber: invoiceData.account_number || "",
          ifsc: invoiceData.ifsc || "",
        },
      });
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
      tone: "primary" as const,
    },
    {
      title: "Invoice Recorded",
      timestamp: invoice.created_at,
      description: "Invoice and line items saved to the ledger.",
      icon: CheckCircle2,
      tone: "muted" as const,
    },
  ].filter(Boolean) as { title: string; timestamp: string; description: string; icon: typeof Send; tone: "primary" | "muted" }[];

  const status = invoice.pdf_url ? "RECONCILED" : "DRAFT";

  return (
    <div className="w-full relative">
      <InvoicePrintLayout />
      <div className="print:hidden w-full">
      <Link
        href="/dashboard/invoices"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Invoices
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4 min-w-0">
          <div className="no-print sticky top-14 sm:top-18 lg:top-19 z-30 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{invoice.customer_name}</h1>
                <StatusBadge status={status} />
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button asChild variant="outline">
                  <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as PDF
                </Button>
                <Select value={template} onValueChange={(val) => changeTemplate(val as any)}>
                  <SelectTrigger className="w-27.5 h-9">
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => toast.info("Sending invoices is coming soon.")}>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
                {invoice.pdf_url && (
                  <Button asChild variant="outline">
                    <a href={invoice.pdf_url} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </a>
                  </Button>
                )}
                <Button onClick={() => toast.info("Recording payments is coming soon.")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-2">
              Invoice ID: {invoice.invoice_number} &middot; Issued on {format(new Date(invoice.created_at), "MMM dd, yyyy")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Issuer / From
              </p>
              <p className="font-semibold text-foreground">{invoice.business_name || "—"}</p>
              {invoice.business_phone && (
                <p className="text-sm text-muted-foreground mt-1">{invoice.business_phone}</p>
              )}
              {invoice.business_address && (
                <p className="text-sm text-muted-foreground mt-1">{invoice.business_address}</p>
              )}
              {invoice.business_gstin && (
                <p className="text-sm text-primary font-mono mt-2">GSTIN: {invoice.business_gstin}</p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Recipient / To
              </p>
              <p className="font-semibold text-foreground">{customer?.name || invoice.customer_name}</p>
              {customer?.phone && <p className="text-sm text-muted-foreground mt-1">{customer.phone}</p>}
              {customer?.address && <p className="text-sm text-muted-foreground mt-1">{customer.address}</p>}
              {customer?.aadhaar && (
                <p className="text-sm text-primary font-mono mt-2">Aadhaar: {customer.aadhaar}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-130">
                <thead className="bg-muted/50">
                  <tr className="text-muted-foreground">
                    <th className="py-3 px-5 font-medium text-[11px] uppercase tracking-wider">Item Description</th>
                    <th className="py-3 px-5 font-medium text-[11px] uppercase tracking-wider text-right">Qty</th>
                    <th className="py-3 px-5 font-medium text-[11px] uppercase tracking-wider text-right">Rate</th>
                    <th className="py-3 px-5 font-medium text-[11px] uppercase tracking-wider text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-5 text-foreground font-medium">{item.product_name}</td>
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
          <p className="text-xs text-muted-foreground mb-4">Automated event checks for {invoice.invoice_number}</p>
          <div className="space-y-4">
            {auditEvents.map((event, i) => (
              <div key={i} className="flex gap-3">
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 rounded-full shrink-0",
                    event.tone === "primary" ? "bg-primary" : "bg-muted-foreground/40"
                  )}
                />
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
    </div>
  );
}
