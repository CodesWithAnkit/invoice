import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/api/auth";
import { serverError } from "@/lib/api/respond";

// Characters with meaning in PostgREST ilike patterns.
const PATTERN_SYNTAX = /[%*\\]/g;

// GET /api/products?industry=&search= — the business's products (max 20).
export async function GET(request: Request) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry") || "all";
    const search = (searchParams.get("search") || "").replace(PATTERN_SYNTAX, " ").trim();

    let query = auth.supabase.from("products").select("*").eq("business_id", auth.businessId);

    if (industry && industry !== "all") {
      query = query.eq("industry", industry);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query.limit(20);
    if (error) throw error;

    return NextResponse.json({ products: data });
  } catch (error) {
    return serverError("Error fetching products", error);
  }
}
