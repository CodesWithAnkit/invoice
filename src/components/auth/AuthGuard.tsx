"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { checked, authed } = useAuth();
  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    if (!checked) return;
    if (!authed && !isLoginRoute) {
      router.push("/login");
    } else if (authed && isLoginRoute) {
      router.push("/");
    }
  }, [checked, authed, isLoginRoute, router]);

  if (isLoginRoute) return <>{children}</>;
  if (!checked || !authed) return null;

  return <>{children}</>;
}
