import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const roleBasedRoutes: Record<string, string[]> = {
  "/admin": ["admin"],
  "/doctor": ["doctor"],
  "/receptionist": ["receptionist"],
  "/patient": ["patient"],
};

const roleHomePaths: Record<string, string> = {
  admin: "/admin",
  doctor: "/doctor",
  receptionist: "/receptionist",
  patient: "/patient",
};

// ── Rate Limiting (in-memory, single-instance) ──
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  "POST:/api/auth/register": { maxRequests: 5, windowMs: 60_000 },
  "POST:/api/appointments": { maxRequests: 10, windowMs: 60_000 },
};

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(method: string, pathname: string, ip: string): boolean {
  const key = `${method}:${pathname}`;
  const limit = RATE_LIMITS[key];
  if (!limit) return true; // No limit configured

  const mapKey = `${key}:${ip}`;
  const now = Date.now();
  const entry = rateLimitMap.get(mapKey);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(mapKey, { count: 1, resetAt: now + limit.windowMs });
    return true;
  }

  if (entry.count >= limit.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup old entries periodically (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(rateLimitMap)) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const method = req.method;
  const session = req.auth;

  // ── Rate limiting for specific POST endpoints ──
  if (method === "POST") {
    const ip = getClientIP(req);
    const allowed = checkRateLimit(method, pathname, ip);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "অনেক বেশি অনুরোধ। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।" },
        { status: 429 }
      );
    }
  }

  // ── Role-based route protection ──
  const matchedRoute = Object.keys(roleBasedRoutes).find((path) =>
    pathname.startsWith(path)
  );

  if (matchedRoute) {
    if (!session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const allowedRoles = roleBasedRoutes[matchedRoute];
    if (!allowedRoles.includes(session.user.role)) {
      const redirectPath = roleHomePaths[session.user.role] || "/";
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }
  }

  // ── Redirect logged-in users from login/register ──
  if (session?.user && (pathname === "/login" || pathname === "/register")) {
    const redirectPath = roleHomePaths[session.user.role] || "/";
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/receptionist/:path*",
    "/patient/:path*",
    "/login",
    "/register",
    "/api/auth/register",
    "/api/appointments",
  ],
};

