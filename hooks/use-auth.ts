"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "@/shared/schema";

/**
 * Hook to get the current authentication state
 */
export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    session,
  };
}

/**
 * Hook to check if the current user has a specific role
 */
export function useHasRole(role: UserRole) {
  const { user } = useAuth();
  return user?.roles?.includes(role) ?? false;
}

/**
 * Hook to check if the current user has any of the specified roles
 */
export function useHasAnyRole(roles: UserRole[]) {
  const { user } = useAuth();
  return roles.some(role => user?.roles?.includes(role)) ?? false;
}

/**
 * Hook to check if the current user is a manager
 */
export function useIsManager() {
  return useHasRole("MANAGER");
}
