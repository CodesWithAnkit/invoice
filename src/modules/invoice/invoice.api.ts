import { apiFetch } from "@/lib/api/client";

// Browser calls for the invoice dashboard pages. Rows are the raw Supabase
// records the pages already map (legacy invoice feature, R-00).
/* eslint-disable @typescript-eslint/no-explicit-any */
export type InvoiceBundle = { invoice: any; customer: any | null; items: any[] };

export function fetchInvoices(params: { search: string; type: string; sort: string }) {
  return apiFetch<any[]>(`/api/invoices?${new URLSearchParams(params)}`);
}

export function fetchInvoiceBundle(id: string) {
  return apiFetch<InvoiceBundle>(`/api/invoices/${encodeURIComponent(id)}`);
}

export function deleteInvoice(id: string) {
  return apiFetch<{ id: string }>(`/api/invoices/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function fetchCustomersWithInvoiceStats() {
  return apiFetch<{
    customers: any[];
    invoiceStats: { customer_id: string; total: number | null; pdf_url: string | null }[];
  }>("/api/customers");
}
