"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "@/types";

export function useAuth() {
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = session?.user;

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor";
  const isReceptionist = user?.role === "receptionist";
  const isPatient = user?.role === "patient";

  const getDashboardPath = (): string => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin":
        return "/admin";
      case "doctor":
        return "/doctor";
      case "receptionist":
        return "/receptionist";
      case "patient":
        return "/patient";
      default:
        return "/login";
    }
  };

  return {
    user,
    session,
    status,
    isAuthenticated,
    isLoading,
    hasRole,
    isAdmin,
    isDoctor,
    isReceptionist,
    isPatient,
    getDashboardPath,
  };
}
