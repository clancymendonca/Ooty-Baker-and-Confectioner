import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session-token";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Routes that may receive cross-origin POSTs without a same-origin / CSRF
 * check. Login starts the session; the public inquiry POST is for
 * unauthenticated visitors. Both are independently rate-limited.
 */
const CSRF_EXEMPT = (pathname: string) =>
  pathname === "/api/auth/login" || pathname === "/api/inquiries";

/**
 * Lightweight CSRF defense: for state-changing requests under `/api/*`,
 * require the `Origin` header to match the site origin. Browsers always send
 * `Origin` on cross-site fetches, so a missing/mismatched value indicates a
 * forged request from a foreign page.
 */
function isCsrfValid(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Some same-origin tools (curl, server-to-server) omit Origin. Allow when
    // the Sec-Fetch-Site header confirms a same-origin or non-CORS context.
    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite === "same-origin" || fetchSite === "none") {
      return true;
    }
    return false;
  }

  try {
    const expected = new URL(request.url).origin;
    return new URL(origin).origin === expected;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF gate: state-changing /api/* requests must be same-origin (with
  // narrow exemptions for login and the public inquiry endpoint).
  if (
    pathname.startsWith("/api") &&
    !SAFE_METHODS.has(request.method) &&
    !CSRF_EXEMPT(pathname)
  ) {
    if (!isCsrfValid(request)) {
      return NextResponse.json(
        { error: "Cross-site request blocked" },
        { status: 403 }
      );
    }
  }

  // Exclude auth API routes - they handle their own authentication
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Public-GET allowlist. /export endpoints stay protected even though they
  // share the /api/products and /api/inquiries prefixes.
  const isPublicReadable = (path: string) =>
    (path === "/api/products" || path.startsWith("/api/products/")) &&
      !path.startsWith("/api/products/export") ||
    (path === "/api/banners" || path.startsWith("/api/banners/")) ||
    path === "/api/categories" ||
    path.startsWith("/api/categories/");

  if (request.method === "GET" && isPublicReadable(pathname)) {
    return NextResponse.next();
  }

  // Public POST: anonymous visitors submit inquiries from the marketing site.
  // The route handler still rate-limits and validates the payload.
  if (
    request.method === "POST" &&
    pathname === "/api/inquiries"
  ) {
    return NextResponse.next();
  }

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/api/dashboard", "/api/inquiries", "/api/analytics"];
  const isMutatingProductsRoute =
    pathname.startsWith("/api/products") && request.method !== "GET";
  const isMutatingBannersRoute =
    pathname.startsWith("/api/banners") && request.method !== "GET";

  const isProtectedRoute =
    protectedRoutes.some((route) => pathname.startsWith(route)) ||
    isMutatingProductsRoute ||
    isMutatingBannersRoute;

  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get("auth_session");

    const token = sessionCookie?.value;
    const sessionData = token ? await verifySessionToken(token) : null;
    const isExpired =
      !sessionData || Number.isNaN(new Date(sessionData.expiresAt).getTime())
        ? true
        : new Date(sessionData.expiresAt) < new Date();

    if (!sessionCookie || !sessionData || isExpired) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      } else {
        const authUrl = new URL("/auth", request.url);
        authUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(authUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|images|uploads).*)",
  ],
};
