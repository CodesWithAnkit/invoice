import type { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { fail } from "./respond";

// Route-handler guards. src/proxy.ts already rejects anonymous requests; these
// re-check in the handler (defence in depth) and resolve ownership from the
// session only, never from the request body (AC-AUTHZ-003).
//
// Usage:
//   const auth = await requireBusiness();
//   if (!auth.ok) return auth.response;
//   const { supabase, businessId } = auth;

type Failure = { ok: false; response: NextResponse };

export type UserContext = { ok: true; supabase: SupabaseClient; user: User };
export type BusinessContext = UserContext & { businessId: string };

export async function requireUser(): Promise<UserContext | Failure> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, response: fail("Unauthorized", 401) };
  return { ok: true, supabase, user };
}

export async function requireBusiness(): Promise<BusinessContext | Failure> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  const { data, error } = await auth.supabase.rpc("current_business_id");
  if (error || !data) {
    console.error("No business for user", auth.user.id, error);
    return { ok: false, response: fail("No business is set up for this account.", 403) };
  }
  return { ...auth, businessId: data as string };
}
