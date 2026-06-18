import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const protectedRoutes: Record<string, string[]> = {
  "/admin": ["admin"],
  "/doctor": ["doctor"],
  "/receptionist": ["receptionist"],
  "/patient": ["patient"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const protectedPath = Object.keys(protectedRoutes).find((path) =>
    pathname.startsWith(path)
  );

  if (protectedPath) {
    if (!session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const allowedRoles = protectedRoutes[protectedPath];
    if (!allowedRoles.includes(session.user.role)) {
      const rolePaths: Record<string, string> = {
        admin: "/admin",
        doctor: "/doctor",
        receptionist: "/receptionist",
        patient: "/patient",
      };
      const redirectPath = rolePaths[session.user.role] || "/";
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }
  }

  if (session?.user && (pathname === "/login" || pathname === "/register")) {
    const rolePaths: Record<string, string> = {
      admin: "/admin",
      doctor: "/doctor",
      receptionist: "/receptionist",
      patient: "/patient",
    };
    const redirectPath = rolePaths[session.user.role] || "/";
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
  ],
};
