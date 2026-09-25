import { requireBusiness } from "@/lib/api/auth";
import { ok, serverError } from "@/lib/api/respond";

// GET /api/customers — the business's customers plus the per-invoice fields the
// customer list aggregates (count/total per customer).
export async function GET() {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const [customersRes, invoicesRes] = await Promise.all([
      supabase.from("customers").select("*").eq("business_id", businessId),
      supabase.from("invoices").select("customer_id, total, pdf_url").eq("business_id", businessId),
    ]);
    if (customersRes.error) throw customersRes.error;
    if (invoicesRes.error) throw invoicesRes.error;

    return ok({ customers: customersRes.data ?? [], invoiceStats: invoicesRes.data ?? [] });
  } catch (error) {
    return serverError("List customers failed", error);
  }
}
