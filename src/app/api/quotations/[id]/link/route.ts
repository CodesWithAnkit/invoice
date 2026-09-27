import { lifecycleRoute, ok, type LifecycleParams } from "../../_lib/lifecycle";

// POST /api/quotations/:id/link — regenerate the public token; the old link stops working (R-17).
export async function POST(_req: Request, ctx: LifecycleParams) {
  return lifecycleRoute(ctx, "Regenerate quotation link failed", async ({ supabase }, id) => {
    const { data, error } = await supabase.rpc("regenerate_quotation_token", { p_quotation_id: id });
    if (error) throw error;
    return ok({ public_token: data as string });
  });
}
