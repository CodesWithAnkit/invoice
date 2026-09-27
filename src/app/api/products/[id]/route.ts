import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/api/auth";
import { serverError, fail } from "@/lib/api/respond";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  price: z.number().optional(), // For legacy price numeric
  kind: z.enum(["product", "service"]).optional(),
  pricing_model: z.enum(["fixed", "hourly", "daily", "quantity", "percentage"]).optional(),
  unit: z.string().optional().nullable(),
  default_rate_minor: z.number().optional().nullable(),
  default_percent_bp: z.number().optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const json = await request.json();
    const validated = updateProductSchema.safeParse(json);

    if (!validated.success) {
      return fail("Invalid product data", 422);
    }

    const { data, error } = await auth.supabase
      .from("products")
      .update(validated.data)
      .eq("id", id)
      .eq("business_id", auth.businessId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return serverError("Error updating product", error);
  }
}
