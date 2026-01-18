import { auth } from "@/lib/auth";
import type { UserRole } from "@/shared/schema";
import { NextResponse } from "next/server";

/**
 * Get the current session or throw 401
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session || !session.user) {
    throw new NextResponse(
      JSON.stringify({ error: "Unauthorized - Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  
  return session;
}

/**
 * Check if the current user has a specific role
 */
export async function requireRole(role: UserRole) {
  const session = await requireAuth();
  
  if (!session.user.roles.includes(role)) {
    throw new NextResponse(
      JSON.stringify({ error: "Forbidden - Insufficient permissions" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  
  return session;
}

/**
 * Check if the current user has any of the specified roles
 */
export async function requireAnyRole(roles: UserRole[]) {
  const session = await requireAuth();
  
  const hasRole = roles.some(role => session.user.roles.includes(role));
  
  if (!hasRole) {
    throw new NextResponse(
      JSON.stringify({ error: "Forbidden - Insufficient permissions" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  
  return session;
}

/**
 * Get the current session (nullable - doesn't throw)
 */
export async function getSession() {
  return await auth();
}
