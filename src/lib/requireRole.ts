import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/types";

/**
 * Server-side role guard for API routes.
 * Returns the session if the user has one of the allowed roles,
 * otherwise returns a 401/403 NextResponse.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized — please log in" },
        { status: 401 }
      ),
      session: null,
    };
  }

  if (!allowedRoles.includes(session.user.role)) {
    return {
      error: NextResponse.json(
        { success: false, error: "Forbidden — insufficient permissions" },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Server-side role guard for layout / page components.
 * Redirects to /login if no session, or /unauthorized if role mismatch.
 * Returns the session if authorised.
 */
export async function requireRolePage(allowedRoles: UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return session;
}
