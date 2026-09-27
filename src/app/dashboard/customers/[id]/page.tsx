import { requireBusiness } from "@/lib/api/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireBusiness();
  if (!auth.ok) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
    return null;
  }

  const { id } = await params;
  const { supabase, businessId } = auth;

  const [customerRes, invoiceRes, projectRes] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).eq("business_id", businessId).single(),
    supabase.from("invoices").select("id, invoice_number, total, pdf_url, created_at").eq("customer_id", id),
    supabase.from("projects").select("id, name, status, created_at").eq("customer_id", id),
  ]);

  if (customerRes.error || !customerRes.data) {
    notFound();
  }

  const customer = customerRes.data;
  const invoices = invoiceRes.data || [];
  const projects = projectRes.data || [];

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
            <Badge variant={customer.status === "active" ? "default" : "secondary"}>
              {customer.status}
            </Badge>
          </div>
        </div>
        <Link href={`/dashboard/customers/${id}/edit`}>
          <Button variant="outline">
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground border-b border-border pb-2">Contact Details</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Email</p>
              <p>{customer.email || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Phone</p>
              <p>{customer.phone || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Address</p>
              <p className="whitespace-pre-line">{customer.address || "—"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground border-b border-border pb-2">Business Details</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Tax ID</p>
              <p className="font-mono">{customer.tax_id || customer.aadhaar || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Company Name</p>
              <p>{customer.company_name || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Notes</p>
              <p className="whitespace-pre-line">{customer.notes || "—"}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Optional: Add sections for Projects and Invoices lists here */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground border-b border-border pb-2">Recent Projects ({projects.length})</h2>
          {projects.length === 0 ? (
             <p className="text-sm text-muted-foreground">No projects found.</p>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map(p => (
                 <div key={p.id} className="flex justify-between items-center text-sm">
                   <Link href={`/dashboard/projects/${p.id}`} className="hover:underline font-medium">
                     {p.name}
                   </Link>
                   <Badge variant="outline">{p.status}</Badge>
                 </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground border-b border-border pb-2">Recent Invoices ({invoices.length})</h2>
          {invoices.length === 0 ? (
             <p className="text-sm text-muted-foreground">No invoices found.</p>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map(inv => (
                 <div key={inv.id} className="flex justify-between items-center text-sm">
                   <Link href={`/dashboard/invoices/${inv.id}`} className="hover:underline font-medium font-mono">
                     {inv.invoice_number || "Draft"}
                   </Link>
                   <span>${inv.total ? inv.total.toLocaleString() : "0"}</span>
                 </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
