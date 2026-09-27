import { requireBusiness } from "@/lib/api/auth";
import { fail, ok, serverError } from "@/lib/api/respond";
import { z } from "zod";

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  customer_id: z.string().uuid("Valid customer ID is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
  start_date: z.string().optional(),
  expected_end_date: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const body = await req.json();

    const validated = CreateProjectSchema.safeParse(body);
    if (!validated.success) {
      return fail(validated.error.issues[0]?.message || "Invalid input", 400);
    }

    const { name, customer_id, description, notes, start_date, expected_end_date } = validated.data;

    const res = await supabase
      .from("projects")
      .insert({
        business_id: businessId,
        customer_id,
        name: name.trim(),
        description: description || null,
        notes: notes || null,
        start_date: start_date || null,
        expected_end_date: expected_end_date || null,
        status: "Draft",
      })
      .select("id")
      .single();

    if (res.error) throw res.error;

    return ok(res.data);
  } catch (error) {
    return serverError("Create project failed", error);
  }
}

export async function GET(req: Request) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const statusFilter = url.searchParams.get("status") || "";

    let query = supabase
      .from("projects")
      .select(`
        *,
        customers ( id, name ),
        quotations ( id, status, created_at )
      `)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const res = await query;
    if (res.error) throw res.error;

    type QuotationRow = { id: string; status: string; created_at: string };
    type ProjectRow = typeof res.data[number] & { quotations?: QuotationRow[] | null };

    // Derive status from latest quotation (R-18)
    const projects = (res.data as ProjectRow[]).map((project) => {
      let derivedStatus = project.status as string;

      if (
        !["Draft", "Completed", "Archived"].includes(project.status as string) &&
        project.quotations &&
        project.quotations.length > 0
      ) {
        const sorted = [...project.quotations].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const map: Record<string, string> = {
          Draft: "Estimating",
          Sent: "Quoted",
          Accepted: "Accepted",
          Rejected: "Rejected",
          Expired: "Expired",
        };
        derivedStatus = map[sorted[0].status] ?? (project.status as string);
      }

      return { ...project, status: derivedStatus };
    });

    // Apply status filter after derivation (derived statuses are not in DB)
    const filtered = statusFilter
      ? projects.filter((p) => p.status === statusFilter)
      : projects;

    return ok({ projects: filtered });
  } catch (error) {
    return serverError("List projects failed", error);
  }
}
