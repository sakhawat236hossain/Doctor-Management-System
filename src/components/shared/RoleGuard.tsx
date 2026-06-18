"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loading } from "@/components/shared/Loading";
import type { UserRole } from "@/types";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackPath }: RoleGuardProps) {
  const { user, isLoading, isAuthenticated, getDashboardPath } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      if (user && !allowedRoles.includes(user.role)) {
        router.replace(fallbackPath || getDashboardPath());
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router, fallbackPath, getDashboardPath]);

  if (isLoading) {
    return <Loading fullScreen message="Verifying access..." />;
  }

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return <Loading fullScreen message="Redirecting..." />;
  }

  return <>{children}</>;
}
