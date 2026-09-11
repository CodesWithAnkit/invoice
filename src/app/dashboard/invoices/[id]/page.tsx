"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/../lib/supabase";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

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
      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();
      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Fetch customer
      if (invoiceData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", invoiceData.customer_id)
          .single();
        if (customerError) throw customerError;
        setCustomer(customerData);
      }

      // Fetch items
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h2 className="text-2xl font-bold mb-4">Invoice Not Found</h2>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Invoices
          </Link>
          <div className="flex gap-4">
            {invoice.pdf_url && (
              <a
                href={invoice.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted transition shadow-sm"
              >
                <Printer className="w-4 h-4 mr-2" />
                View PDF
              </a>
            )}
            {invoice.pdf_url && (
              <a
                href={invoice.pdf_url}
                download
                className="inline-flex items-center px-4 py-2 bg-primary rounded-lg text-primary-foreground hover:bg-primary/90 transition shadow-md"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-8 border-b border-border flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Invoice #{invoice.invoice_number}
              </h1>
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                {invoice.invoice_type || "Standard"}
              </span>
            </div>
            <div className="text-right text-muted-foreground">
              <p>Date: {format(new Date(invoice.created_at), "MMMM dd, yyyy")}</p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-2 gap-8 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Billed To
              </h3>
              {customer ? (
                <div className="space-y-1">
                  <p className="font-medium text-foreground text-lg">{customer.name}</p>
                  {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                  {customer.address && <p className="text-muted-foreground">{customer.address}</p>}
                  {customer.aadhaar && <p className="text-muted-foreground">Aadhaar: {customer.aadhaar}</p>}
                </div>
              ) : (
                <p className="text-muted-foreground">{invoice.customer_name}</p>
              )}
            </div>
            {/* Add 'From' section here if needed */}
          </div>

          <div className="p-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Order Details
            </h3>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 font-medium">Item</th>
                  <th className="py-3 font-medium text-center">Qty</th>
                  <th className="py-3 font-medium text-right">Price</th>
                  <th className="py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 text-foreground">{item.product_name}</td>
                    <td className="py-4 text-center text-muted-foreground">{item.quantity}</td>
                    <td className="py-4 text-right text-muted-foreground">
                      ₹{item.unit_price?.toLocaleString()}
                    </td>
                    <td className="py-4 text-right font-medium text-foreground">
                      ₹{item.total?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8 pt-8 border-t border-border flex justify-end">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{invoice.subtotal?.toLocaleString() || "0.00"}</span>
                </div>
                {(invoice.cgst > 0 || invoice.sgst > 0) && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>CGST</span>
                      <span>₹{invoice.cgst?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>SGST</span>
                      <span>₹{invoice.sgst?.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-xl font-bold text-foreground pt-3 border-t border-border">
                  <span>Total</span>
                  <span>₹{invoice.total?.toLocaleString() || "0.00"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
