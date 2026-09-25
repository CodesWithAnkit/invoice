// Route access rules shared by the server-side proxy (src/proxy.ts) and the
// client shell (AppLayout / AuthGuard), so both agree on what is public.

/** Sign-in/up pages: rendered without the app shell; signed-in users are sent away. */
export const AUTH_PAGES = ["/login", "/register", "/forgot-password"] as const;

/** Reachable with or without a session (a password-recovery session lands here). */
export const RESET_PASSWORD_PATH = "/reset-password";

/** Email-link handler (confirmation + recovery code exchange). */
export const AUTH_CALLBACK_PATH = "/auth/callback";

/** Where users land after signing in when no `next` is given (PRD §7: → Dashboard). */
export const DEFAULT_AUTHED_PATH = "/dashboard/overview";

export const LOGIN_PATH = "/login";

function matches(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function isAuthPage(pathname: string) {
  return AUTH_PAGES.some((p) => matches(pathname, p));
}

/** Pages rendered without the sidebar/top-nav shell. */
export function isShellFreePage(pathname: string) {
  return isAuthPage(pathname) || matches(pathname, RESET_PASSWORD_PATH) || matches(pathname, "/public");
}

/** Paths that never require a session. */
export function isPublicPath(pathname: string) {
  return (
    isShellFreePage(pathname) ||
    matches(pathname, AUTH_CALLBACK_PATH) ||
    matches(pathname, "/api/public")
  );
}

/**
 * Only allow same-origin relative redirects (prevents open redirects via `?next=`).
 */
export function safeNextPath(next: string | null | undefined, fallback = DEFAULT_AUTHED_PATH) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
