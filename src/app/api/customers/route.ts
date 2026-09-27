import { requireBusiness } from "@/lib/api/auth";
import { fail, ok, serverError } from "@/lib/api/respond";

// GET /api/customers
export async function GET(req: Request) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const sort = url.searchParams.get("sort") || "name";
    const dir = url.searchParams.get("dir") === "desc" ? "desc" : "asc";

    let query = supabase.from("customers").select("*").eq("business_id", businessId);
    
    if (search) {
       query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    query = query.order(sort, { ascending: dir === "asc" });

    const [customersRes, invoicesRes] = await Promise.all([
      query,
      supabase.from("invoices").select("customer_id, total, pdf_url").eq("business_id", businessId),
    ]);
    if (customersRes.error) throw customersRes.error;
    if (invoicesRes.error) throw invoicesRes.error;

    return ok({ customers: customersRes.data ?? [], invoiceStats: invoicesRes.data ?? [] });
  } catch (error) {
    return serverError("List customers failed", error);
  }
}

export async function POST(req: Request) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const body = await req.json();
    const { name, phone, email, address, notes, tax_id, aadhaar, company_name } = body;
    
    if (!name || typeof name !== "string" || name.trim() === "") {
      return fail("Name is required", 400);
    }

    const res = await supabase
      .from("customers")
      .insert({
        business_id: businessId,
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        address: address || null,
        notes: notes || null,
        tax_id: tax_id || null,
        aadhaar: aadhaar || null,
        company_name: company_name || null,
        status: "active",
      })
      .select()
      .single();

    if (res.error) throw res.error;

    return ok(res.data);
  } catch (error) {
    return serverError("Create customer failed", error);
  }
}
