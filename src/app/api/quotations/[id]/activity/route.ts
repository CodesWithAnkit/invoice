import { fail, lifecycleRoute, ok, type LifecycleParams } from "../../_lib/lifecycle";
import { getQuotation, listActivity } from "@/modules/quotation/quotation.service";

// GET /api/quotations/:id/activity — newest first (AC-ACTIVITY-001/002).
export async function GET(_req: Request, ctx: LifecycleParams) {
  return lifecycleRoute(ctx, "List quotation activity failed", async ({ supabase, businessId }, id) => {
    const record = await getQuotation(supabase, businessId, id);
    if (!record) return fail("Not found", 404);
    return ok({ activity: await listActivity(supabase, businessId, id) });
  });
}
