import { requireBusiness } from "@/lib/api/auth";
import { fail, ok, serverError } from "@/lib/api/respond";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const { id } = await params;

    // The query is isolated to the business by RLS, but we can be explicit
    const res = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);

    if (res.error) {
      // 23503 is the Postgres error code for foreign_key_violation
      if (res.error.code === "23503") {
        return fail("Cannot delete customer referenced by existing invoices, projects, or quotations.", 409);
      }
      throw res.error;
    }

    if (res.count === 0) {
      return fail("Not found", 404);
    }

    return ok({ deleted: true });
  } catch (error) {
    return serverError("Delete customer failed", error);
  }
}
