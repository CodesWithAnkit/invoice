import { createBrowserClient } from "@supabase/ssr";

// Browser client for auth actions (sign in/up, reset). The session lives in
// cookies managed by @supabase/ssr, never in a hand-rolled localStorage flag.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
