import { requireBusiness } from "@/lib/api/auth";
import { fail, ok, serverError } from "@/lib/api/respond";

const MANUAL_STATUSES = ["Draft", "Completed", "Archived"] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const { id } = await params;

    const res = await supabase
      .from("projects")
      .select(`
        *,
        customers ( id, name, email, phone ),
        quotations ( id, status, created_at )
      `)
      .eq("id", id)
      .eq("business_id", businessId)
      .single();

    if (res.error) {
      if (res.error.code === "PGRST116") return fail("Not found", 404);
      throw res.error;
    }

    return ok(res.data);
  } catch (error) {
    return serverError("Get project failed", error);
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

    // Verify ownership first
    const existing = await supabase
      .from("projects")
      .select("id, business_id")
      .eq("id", id)
      .eq("business_id", businessId)
      .single();

    if (existing.error || !existing.data) return fail("Not found", 404);

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "")
        return fail("Name is required", 400);
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.start_date !== undefined) updateData.start_date = body.start_date || null;
    if (body.expected_end_date !== undefined) updateData.expected_end_date = body.expected_end_date || null;

    if (body.status !== undefined) {
      if (!MANUAL_STATUSES.includes(body.status)) {
        return fail(`Status must be one of: ${MANUAL_STATUSES.join(", ")}`, 400);
      }
      updateData.status = body.status;
    }

    const res = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .eq("business_id", businessId)
      .select()
      .single();

    if (res.error) throw res.error;

    return ok(res.data);
  } catch (error) {
    return serverError("Update project failed", error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const { id } = await params;

    // Archive instead of hard-delete to preserve data integrity
    const res = await supabase
      .from("projects")
      .update({ status: "Archived", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("business_id", businessId)
      .select("id")
      .single();

    if (res.error) {
      if (res.error.code === "PGRST116") return fail("Not found", 404);
      throw res.error;
    }

    return ok({ archived: true });
  } catch (error) {
    return serverError("Archive project failed", error);
  }
}
