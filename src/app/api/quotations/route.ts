import { requireBusiness } from "@/lib/api/auth";
import { fail, ok, serverError } from "@/lib/api/respond";
import { CreateQuotationSchema } from "@/modules/quotation/quotation.schema";
import { todayInZone } from "@/modules/quotation/quotation.service";

// POST /api/quotations — create a draft quotation for a project (AC-ESTIMATE-001).
// Defaults (currency, tax, validity, notes, terms) come from business settings;
// currency is copied here and cannot be changed later (R-10).
export async function POST(req: Request) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const body = await req.json().catch(() => null);
    const validated = CreateQuotationSchema.safeParse(body);
    if (!validated.success) {
      return fail(validated.error.issues[0]?.message || "Invalid input", 400);
    }

    const project = await supabase
      .from("projects")
      .select("id, name, customer_id, status")
      .eq("id", validated.data.project_id)
      .eq("business_id", businessId)
      .maybeSingle();
    if (project.error) throw project.error;
    if (!project.data) return fail("Not found", 404);
    if (project.data.status === "Archived") {
      return fail("Archived projects can't get new quotations.", 400);
    }

    const business = await supabase
      .from("businesses")
      .select("currency, timezone, default_validity_days, default_tax_name, default_tax_rate_bp, default_notes, default_terms")
      .eq("id", businessId)
      .single();
    if (business.error) throw business.error;
    const settings = business.data;
    const timeZone = settings.timezone || "Asia/Kolkata";

    const created = await supabase
      .from("quotations")
      .insert({
        business_id: businessId,
        project_id: project.data.id,
        customer_id: project.data.customer_id,
        status: "Draft",
        title: project.data.name,
        currency: settings.currency || "INR",
        issue_date: todayInZone(timeZone),
        valid_until: todayInZone(timeZone, settings.default_validity_days ?? 30),
        tax_name: settings.default_tax_name || null,
        tax_rate_bp: settings.default_tax_rate_bp ?? 0,
        notes: settings.default_notes || null,
        terms: Array.isArray(settings.default_terms)
          ? settings.default_terms.filter((t: unknown) => typeof t === "string")
          : [],
      })
      .select("id")
      .single();
    if (created.error) throw created.error;

    const scope = await supabase.from("quotation_scope").insert({ quotation_id: created.data.id });
    if (scope.error) throw scope.error;

    // A project leaves manual "Draft" once estimating starts; from then on its
    // status is derived from the latest quotation (R-18).
    if (project.data.status === "Draft") {
      const moved = await supabase
        .from("projects")
        .update({ status: "Estimating", updated_at: new Date().toISOString() })
        .eq("id", project.data.id)
        .eq("business_id", businessId);
      if (moved.error) throw moved.error;
    }

    return ok({ id: created.data.id as string });
  } catch (error) {
    return serverError("Create quotation failed", error);
  }
}
