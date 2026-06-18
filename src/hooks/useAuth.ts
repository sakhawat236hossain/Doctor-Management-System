"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "@/types";

export function useAuth() {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const user = session?.user;
  const role = user?.role ?? null;

  const isAdmin = role === "admin";
  const isDoctor = role === "doctor";
  const isReceptionist = role === "receptionist";
  const isPatient = role === "patient";

  return {
    session,
    role,
    isAdmin,
    isDoctor,
    isReceptionist,
    isPatient,
    isLoading,
  };
}
