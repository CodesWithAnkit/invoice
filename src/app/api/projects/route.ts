import { requireBusiness } from "@/lib/api/auth";
import { fail, ok, serverError } from "@/lib/api/respond";

export async function POST(req: Request) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  try {
    const { supabase, businessId } = auth;
    const body = await req.json();
    const { name, customer_id } = body;
    
    if (!name || typeof name !== "string" || name.trim() === "") {
      return fail("Project name is required", 400);
    }
    
    if (!customer_id || typeof customer_id !== "string") {
      return fail("Customer ID is required", 400);
    }

    const res = await supabase
      .from("projects")
      .insert({
        business_id: businessId,
        customer_id,
        name: name.trim(),
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
    
    // In a full implementation, this query would use a database view or RPC to efficiently
    // compute the derived status from the latest quotation. 
    // For MVP, we can fetch projects and their latest quotation.
    const res = await supabase
      .from("projects")
      .select(`
        *,
        quotations (
          id,
          status,
          created_at
        )
      `)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (res.error) throw res.error;
    
    // Derive status logic
    const projects = res.data.map(project => {
      let derivedStatus = project.status;
      
      // If manual status is Draft, Completed, or Archived, it takes precedence.
      // Otherwise derive from latest quotation.
      if (!["Draft", "Completed", "Archived"].includes(project.status) && project.quotations && project.quotations.length > 0) {
        // Sort quotations descending by created_at
        const sortedQuotations = [...project.quotations].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const latestQuotation = sortedQuotations[0];
        
        if (latestQuotation.status === "Draft") {
          derivedStatus = "Estimating";
        } else if (latestQuotation.status === "Sent") {
          derivedStatus = "Quoted";
        } else if (latestQuotation.status === "Accepted") {
          derivedStatus = "Accepted";
        } else if (latestQuotation.status === "Rejected") {
          derivedStatus = "Rejected";
        } else if (latestQuotation.status === "Expired") {
          derivedStatus = "Expired";
        }
      }
      
      // Strip quotations from output if not needed, or keep for client details
      return {
        ...project,
        status: derivedStatus,
        _manual_status: project.status
      };
    });

    return ok({ projects });
  } catch (error) {
    return serverError("List projects failed", error);
  }
}
