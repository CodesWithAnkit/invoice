import type { NextRequest } from "next/server";
import { requireBusiness } from "@/lib/api/auth";
import { fail, ok, serverError } from "@/lib/api/respond";

const SORTS = {
  newest: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  highest: { column: "total", ascending: false },
  lowest: { column: "total", ascending: true },
} as const;

// Characters with meaning in a PostgREST `or=` filter; stripped from search
// input so it cannot alter the filter.
const FILTER_SYNTAX = /[,()*%\\]/g;

// GET /api/invoices?search=&type=&sort= — the business's invoices.
export async function GET(request: NextRequest) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  const params = request.nextUrl.searchParams;
  const search = (params.get("search") ?? "").replace(FILTER_SYNTAX, " ").trim().slice(0, 100);
  const type = params.get("type") ?? "all";
  const sortKey = (params.get("sort") ?? "newest") as keyof typeof SORTS;
  const sort = SORTS[sortKey];
  if (!sort) return fail("Invalid sort.", 400);

  try {
    let query = auth.supabase.from("invoices").select("*").eq("business_id", auth.businessId);
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,invoice_number.ilike.%${search}%`);
    }
    if (type !== "all") query = query.eq("invoice_type", type);

    const { data, error } = await query.order(sort.column, { ascending: sort.ascending });
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    return serverError("List invoices failed", error);
  }
}
