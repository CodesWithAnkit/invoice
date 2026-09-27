import { fail, lifecycleRoute, ok, type LifecycleParams } from "../../_lib/lifecycle";
import { validateForSend } from "@/modules/quotation/quotation.document";
import { buildLiveDocument, getQuotation, todayInZone } from "@/modules/quotation/quotation.service";

// POST /api/quotations/:id/send — Draft → Sent (R-12): validate required data
// (AC-QUOTE-002), then number + snapshot + public token in one transaction.
export async function POST(_req: Request, ctx: LifecycleParams) {
  return lifecycleRoute(ctx, "Send quotation failed", async ({ supabase, businessId }, id) => {
    const record = await getQuotation(supabase, businessId, id);
    if (!record) return fail("Not found", 404);
    if (record.status !== "Draft") return fail("Only draft quotations can be sent.", 409);

    const business = await supabase.from("businesses").select("timezone").eq("id", businessId).single();
    if (business.error) throw business.error;
    const issues = validateForSend(record, todayInZone(business.data.timezone || "Asia/Kolkata"));
    if (issues.length > 0) {
      return Response.json({ error: issues[0].message, issues }, { status: 400 });
    }

    const document = await buildLiveDocument(supabase, businessId, record);
    const { data, error } = await supabase
      .rpc("send_quotation", { p_quotation_id: id, p_snapshot: document })
      .single<{ quote_number: string; public_token: string; version: number }>();
    if (error) throw error;
    return ok(data);
  });
}
