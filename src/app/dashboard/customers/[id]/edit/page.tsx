import { requireBusiness } from "@/lib/api/auth";
import { notFound } from "next/navigation";
import { CustomerForm } from "../../CustomerForm";

export default async function EditCustomerPage({
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

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

  if (error || !customer) {
    notFound();
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>
        <p className="text-muted-foreground">Update details for {customer.name}.</p>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6">
        <CustomerForm 
          customerId={customer.id} 
          initialValues={{
            name: customer.name,
            email: customer.email || "",
            phone: customer.phone || "",
            address: customer.address || "",
            notes: customer.notes || "",
            tax_id: customer.tax_id || customer.aadhaar || "",
            status: customer.status as any,
          }}
        />
      </div>
    </div>
  );
}
