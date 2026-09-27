import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/api/auth";
import { serverError, fail } from "@/lib/api/respond";
import { z } from "zod";

// Characters with meaning in PostgREST ilike patterns.
const PATTERN_SYNTAX = /[%*\\]/g;

export async function GET(request: Request) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").replace(PATTERN_SYNTAX, " ").trim();
    const kind = searchParams.get("kind");
    const activeOnly = searchParams.get("active") !== "false"; // Default to true

    let query = auth.supabase.from("products").select("*").eq("business_id", auth.businessId);

    if (kind && (kind === "product" || kind === "service")) {
      query = query.eq("kind", kind);
    }

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Default sorting
    query = query.order("name", { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    const businessRes = await auth.supabase.from("businesses").select("currency").eq("id", auth.businessId).single();
    const currency = businessRes.data?.currency || "USD";

    return NextResponse.json({ success: true, data: { products: data, currency } });
  } catch (error) {
    return serverError("Error fetching products", error);
  }
}

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().optional(), // For legacy price numeric
  kind: z.enum(["product", "service"]).default("product"),
  pricing_model: z.enum(["fixed", "hourly", "daily", "percentage"]).default("fixed"),
  unit: z.string().optional().nullable(),
  default_rate_minor: z.number().optional().nullable(),
  default_percent_bp: z.number().optional().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const json = await request.json();
    const validated = createProductSchema.safeParse(json);

    if (!validated.success) {
      return fail("Invalid product data", 422);
    }

    const newProduct = {
      ...validated.data,
      business_id: auth.businessId,
    };

    const { data, error } = await auth.supabase
      .from("products")
      .insert(newProduct)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return serverError("Error creating product", error);
  }
}
