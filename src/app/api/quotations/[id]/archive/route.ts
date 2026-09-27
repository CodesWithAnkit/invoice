import { lifecycleRoute, ok, type LifecycleParams } from "../../_lib/lifecycle";

// POST /api/quotations/:id/archive — any status except Archived → Archived (R-11).
export async function POST(_req: Request, ctx: LifecycleParams) {
  return lifecycleRoute(ctx, "Archive quotation failed", async ({ supabase }, id) => {
    const { error } = await supabase.rpc("archive_quotation", { p_quotation_id: id });
    if (error) throw error;
    return ok({ archived: true });
  });
}
