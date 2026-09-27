import { lifecycleRoute, ok, type LifecycleParams } from "../../_lib/lifecycle";

// POST /api/quotations/:id/revise — Sent/Viewed/Rejected/Expired → Draft, version + 1 (R-11).
export async function POST(_req: Request, ctx: LifecycleParams) {
  return lifecycleRoute(ctx, "Revise quotation failed", async ({ supabase }, id) => {
    const { data, error } = await supabase.rpc("revise_quotation", { p_quotation_id: id });
    if (error) throw error;
    return ok({ version: data as number });
  });
}
