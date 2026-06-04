import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/workouts",
  "/nutrition",
  "/sessions",
  "/feed",
  "/friends",
  "/challenges",
  "/profile",
  "/settings",
  "/notifications",
  "/onboarding",
];

// Routes only for unauthenticated users (redirect logged-in users away)
const AUTH_ROUTES = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
  // Refresh session cookies (required by Supabase SSR)
  const response = await updateSession(request);

  const { pathname, searchParams } = request.nextUrl;

  // Check if this is a protected route
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected) {
    // Read the session cookie to detect expiry without an extra DB call
    const hasSession =
      request.cookies.has("sb-access-token") ||
      // Supabase SSR stores the token under a project-specific key
      [...request.cookies.getAll()].some(
        (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
      );

    if (!hasSession) {
      const loginUrl = new URL("/auth/login", request.url);
      // Preserve the current path so we can redirect back after login
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in, don't show auth pages — send to ?redirect or /dashboard
  if (AUTH_ROUTES.includes(pathname)) {
    const hasSession = [...request.cookies.getAll()].some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );
    if (hasSession) {
      const redirectTo = searchParams.get("redirect") ?? "/dashboard";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icons|.*\.png$|.*\.svg$).*)",
  ],
};
