import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_AUTHED_PATH,
  LOGIN_PATH,
  isAuthPage,
  isPublicPath,
} from "@/config/auth";

// Server-side route protection (AC-AUTH-006). Runs before every matched
// request: refreshes the Supabase session cookie, then
//   - API calls without a valid session  → 401 JSON
//   - protected pages without a session  → redirect to /login?next=…
//   - signed-in users on sign-in/up pages → redirect into the app
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    }
  );

  // getUser() asks the Auth server, so a signed-out (revoked) session is
  // rejected even while its access token has not yet expired (AC-AUTH-004).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    if (pathname.startsWith("/api/")) {
      return withCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), response);
    }
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return withCookies(NextResponse.redirect(url), response);
  }

  if (user && isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_AUTHED_PATH;
    url.search = "";
    return withCookies(NextResponse.redirect(url), response);
  }

  return response;
}

// Carry any refreshed/cleared session cookies (and their no-cache headers)
// onto a replacement response.
function withCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  ["cache-control", "expires", "pragma"].forEach((key) => {
    const value = source.headers.get(key);
    if (value) target.headers.set(key, value);
  });
  return target;
}

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|pdf)$).*)",
  ],
};
