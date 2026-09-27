import { requireBusiness } from "@/lib/api/auth";
import { fail, ok, serverError } from "@/lib/api/respond";
import { isUuid } from "@/lib/api/validate";
import { QuotationCalcError } from "@/modules/quotation/quotation.calculator";
import { QuotationDraftSchema, describeIssue } from "@/modules/quotation/quotation.schema";
import { getQuotation, saveDraft } from "@/modules/quotation/quotation.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    if (!isUuid(id)) return fail("Not found", 404);

    const quotation = await getQuotation(auth.supabase, auth.businessId, id);
    if (!quotation) return fail("Not found", 404);
    return ok(quotation);
  } catch (error) {
    return serverError("Get quotation failed", error);
  }
}

// PATCH /api/quotations/:id — replace the whole draft (auto-save, AC-QUOTE-001).
// Totals in the body are ignored; the server recomputes them (AC-CALC-004).
export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const { id } = await params;
    if (!isUuid(id)) return fail("Not found", 404);

    const body = await req.json().catch(() => null);
    const validated = QuotationDraftSchema.safeParse(body);
    if (!validated.success) {
      return fail(describeIssue(validated.error.issues[0]) || "Invalid input", 400);
    }
    const draft = validated.data;

    const existing = await supabase
      .from("quotations")
      .select("id, status")
      .eq("id", id)
      .eq("business_id", businessId)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) return fail("Not found", 404);
    if (existing.data.status !== "Draft") {
      return fail("Only draft quotations can be edited.", 409);
    }

    // Catalog references must be this business's own items.
    const serviceIds = [...new Set(draft.items.map((i) => i.service_id).filter((s): s is string => !!s))];
    if (serviceIds.length > 0) {
      const owned = await supabase
        .from("products")
        .select("id")
        .eq("business_id", businessId)
        .in("id", serviceIds);
      if (owned.error) throw owned.error;
      if ((owned.data ?? []).length !== serviceIds.length) {
        return fail("A selected product or service was not found.", 400);
      }
    }

    try {
      await saveDraft(supabase, id, draft);
    } catch (error) {
      if (error instanceof QuotationCalcError) return fail(error.message, 400);
      if ((error as { code?: string })?.code === "P0002") {
        return fail("Only draft quotations can be edited.", 409);
      }
      throw error;
    }

    const saved = await getQuotation(supabase, businessId, id);
    if (!saved) return fail("Not found", 404);
    return ok(saved);
  } catch (error) {
    return serverError("Save quotation failed", error);
  }
}
