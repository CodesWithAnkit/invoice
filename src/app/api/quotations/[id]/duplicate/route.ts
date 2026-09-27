import { fail, lifecycleRoute, ok, type LifecycleParams } from "../../_lib/lifecycle";
import { getQuotation, recordToDraft, saveDraft, todayInZone } from "@/modules/quotation/quotation.service";

// POST /api/quotations/:id/duplicate — a new draft with the same content (R-03).
// Number, link, status and version start fresh; dates restart from today.
export async function POST(_req: Request, ctx: LifecycleParams) {
  return lifecycleRoute(ctx, "Duplicate quotation failed", async ({ supabase, businessId }, id) => {
    const source = await getQuotation(supabase, businessId, id);
    if (!source) return fail("Not found", 404);

    const business = await supabase
      .from("businesses")
      .select("timezone, default_validity_days")
      .eq("id", businessId)
      .single();
    if (business.error) throw business.error;
    const timeZone = business.data.timezone || "Asia/Kolkata";

    const created = await supabase
      .from("quotations")
      .insert({
        business_id: businessId,
        project_id: source.project_id,
        customer_id: source.customer_id,
        status: "Draft",
        currency: source.currency,
      })
      .select("id")
      .single();
    if (created.error) throw created.error;
    const newId = created.data.id as string;

    const activity = await supabase.from("quotation_activity").insert({
      quotation_id: newId,
      business_id: businessId,
      type: "duplicated",
      actor: "owner",
      version: 1,
      payload: { from_quotation_id: source.id, from_quote_number: source.quote_number },
    });
    if (activity.error) throw activity.error;

    await saveDraft(supabase, newId, {
      ...recordToDraft(source),
      title: `${source.title.slice(0, 100 - " (copy)".length).trimEnd()} (copy)`,
      issue_date: todayInZone(timeZone),
      valid_until: todayInZone(timeZone, business.data.default_validity_days ?? 30),
    });

    return ok({ id: newId });
  });
}
