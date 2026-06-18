"use client";

import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";
import type { ReactNode } from "react";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  const role = session?.user?.role;

  if (!role || !allowedRoles.includes(role)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
