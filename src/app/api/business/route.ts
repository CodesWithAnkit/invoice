import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/api/auth";
import { ok, fail } from "@/lib/api/respond";

export async function GET() {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  const { supabase, businessId } = auth;

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (error || !data) {
    return fail("Failed to fetch business details", 500);
  }

  return ok(data);
}

export async function PATCH(request: Request) {
  const auth = await requireBusiness();
  if (!auth.ok) return auth.response;

  const { supabase, businessId } = auth;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON payload", 400);
  }

  const { name, email, phone, address, website, tax_id, currency, logo_path } = body;

  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (address !== undefined) updates.address = address;
  if (website !== undefined) updates.website = website;
  if (tax_id !== undefined) updates.tax_id = tax_id;
  if (currency !== undefined) updates.currency = currency;
  if (logo_path !== undefined) updates.logo_path = logo_path;
  
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", businessId)
    .select("*")
    .single();

  if (error || !data) {
    return fail("Failed to update business details", 500);
  }

  return ok(data);
}
