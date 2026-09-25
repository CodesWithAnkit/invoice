import { requireBusiness } from "@/lib/api/auth";
import { fail, ok, serverError } from "@/lib/api/respond";
import { isUuid } from "@/lib/api/validate";

type Params = { params: Promise<{ id: string }> };

// Another business's invoice answers 404, never 403, so ids can't be probed.
const NOT_FOUND = "Invoice not found.";

// GET /api/invoices/:id — invoice with its customer and line items.
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!isUuid(id)) return fail(NOT_FOUND, 404);

  try {
    const { supabase, businessId } = auth;
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("business_id", businessId)
      .maybeSingle();
    if (error) throw error;
    if (!invoice) return fail(NOT_FOUND, 404);

    const [customerRes, itemsRes] = await Promise.all([
      invoice.customer_id
        ? supabase.from("customers").select("*").eq("id", invoice.customer_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("invoice_items").select("*").eq("invoice_id", id),
    ]);
    if (customerRes.error) throw customerRes.error;
    if (itemsRes.error) throw itemsRes.error;

    return ok({ invoice, customer: customerRes.data, items: itemsRes.data ?? [] });
  } catch (error) {
    return serverError("Get invoice failed", error);
  }
}

// DELETE /api/invoices/:id — removes the invoice and its line items.
export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!isUuid(id)) return fail(NOT_FOUND, 404);

  try {
    const { supabase, businessId } = auth;
    const { data: existing, error: findError } = await supabase
      .from("invoices")
      .select("id")
      .eq("id", id)
      .eq("business_id", businessId)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing) return fail(NOT_FOUND, 404);

    const { error: itemsError } = await supabase.from("invoice_items").delete().eq("invoice_id", id);
    if (itemsError) throw itemsError;
    const { error: invoiceError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);
    if (invoiceError) throw invoiceError;

    return ok({ id });
  } catch (error) {
    return serverError("Delete invoice failed", error);
  }
}
