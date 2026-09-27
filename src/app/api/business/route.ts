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

  const { 
    name, email, phone, address, website, tax_id, currency, logo_path,
    timezone, default_validity_days, default_terms, default_notes,
    default_tax_name, default_tax_rate_bp, quote_prefix, allow_client_pdf_download
  } = body;

  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (address !== undefined) updates.address = address;
  if (website !== undefined) updates.website = website;
  if (tax_id !== undefined) updates.tax_id = tax_id;
  if (currency !== undefined) updates.currency = currency;
  if (logo_path !== undefined) updates.logo_path = logo_path;
  if (timezone !== undefined) updates.timezone = timezone;
  if (default_validity_days !== undefined) updates.default_validity_days = default_validity_days;
  if (default_terms !== undefined) updates.default_terms = default_terms;
  if (default_notes !== undefined) updates.default_notes = default_notes;
  if (default_tax_name !== undefined) updates.default_tax_name = default_tax_name;
  if (default_tax_rate_bp !== undefined) updates.default_tax_rate_bp = default_tax_rate_bp;
  if (quote_prefix !== undefined) updates.quote_prefix = quote_prefix;
  if (allow_client_pdf_download !== undefined) updates.allow_client_pdf_download = allow_client_pdf_download;
  
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
