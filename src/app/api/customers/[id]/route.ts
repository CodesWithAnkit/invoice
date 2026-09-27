import { requireBusiness } from "@/lib/api/auth";
import { fail, ok, serverError } from "@/lib/api/respond";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const { id } = await params;

    const res = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("business_id", businessId)
      .single();

    if (res.error) {
      if (res.error.code === "PGRST116") return fail("Not found", 404);
      throw res.error;
    }

    return ok(res.data);
  } catch (error) {
    return serverError("Get customer failed", error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const { id } = await params;
    const body = await req.json();

    const { name, phone, email, address, notes, tax_id, status, aadhaar, company_name } = body;

    const updateData: any = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") return fail("Name is required", 400);
      updateData.name = name.trim();
    }
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;
    if (address !== undefined) updateData.address = address || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (tax_id !== undefined) updateData.tax_id = tax_id || null;
    if (aadhaar !== undefined) updateData.aadhaar = aadhaar || null;
    if (company_name !== undefined) updateData.company_name = company_name || null;
    if (status !== undefined) {
       if (!["active", "archived"].includes(status)) return fail("Invalid status", 400);
       updateData.status = status;
    }

    const res = await supabase
      .from("customers")
      .update(updateData)
      .eq("id", id)
      .eq("business_id", businessId)
      .select()
      .single();

    if (res.error) throw res.error;

    return ok(res.data);
  } catch (error) {
    return serverError("Update customer failed", error);
  }
}

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
