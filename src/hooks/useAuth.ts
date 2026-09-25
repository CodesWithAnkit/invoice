"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";
import { LOGIN_PATH } from "@/config/auth";

// Client view of the Supabase session. Route protection itself happens on the
// server (src/proxy.ts); this hook only reflects state for the UI.
export function useAuth() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        setUser(data.user);
        setChecked(true);
      })
      .catch(() => {
        if (active) setChecked(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setChecked(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Revokes this session on the Auth server (AC-AUTH-004), not just locally.
      await createClient().auth.signOut({ scope: "local" });
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      router.replace(LOGIN_PATH);
      router.refresh();
    }
  }, [router]);

  return { checked, authed: !!user, user, signOut };
}
