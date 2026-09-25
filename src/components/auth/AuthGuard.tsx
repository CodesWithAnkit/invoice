"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH, isPublicPath } from "@/config/auth";

// The server proxy (src/proxy.ts) is the real gate. This only reacts to a
// session ending while a protected page is open (sign-out in another tab,
// expired refresh token) by sending the user back to sign in.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { checked, authed } = useAuth();

  useEffect(() => {
    if (checked && !authed && !isPublicPath(pathname)) {
      router.replace(`${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`);
    }
  }, [checked, authed, pathname, router]);

  return <>{children}</>;
}
