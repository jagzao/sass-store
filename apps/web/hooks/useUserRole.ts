"use client";

/**
 * useUserRole Hook
 *
 * Client-side hook for accessing the current user's role.
 * Used by HomeRouter to determine which home view to show.
 */

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import {
  isStaffRole,
  isClientRole,
  shouldShowHomeTenant,
  shouldShowPublicHome,
  normalizeRole,
  getRoleDisplayName,
  type UserRole,
} from "@/lib/auth/role-guards";

export interface UseUserRoleResult {
  /** Raw role string from session */
  role: UserRole | null;
  /** Normalized role for comparison */
  normalizedRole: string | null;
  /** Whether user has a staff role (admin, gerente, personal) */
  isStaff: boolean;
  /** Whether user has a client role (cliente) */
  isClient: boolean;
  /** Whether user should see HomeTenant dashboard */
  showHomeTenant: boolean;
  /** Whether user should see public home */
  showPublicHome: boolean;
  /** Display name for the role */
  displayName: string | null;
  /** Whether the session is still loading */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
}

/**
 * Hook to get and analyze the current user's role
 *
 * @example
 * ```tsx
 * const { showHomeTenant, isStaff, role } = useUserRole();
 *
 * if (showHomeTenant) {
 *   return <HomeTenant />;
 * }
 * return <PublicHome />;
 * ```
 */
export function useUserRole(): UseUserRoleResult {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  // Extract role from session - handle various possible locations
  const role = useMemo(() => {
    if (!session?.user) return null;

    // Try common role locations
    const user = session.user as any;
    return (
      user.role ||
      user.userRole ||
      user.tenantRole ||
      user.permissions?.role ||
      null
    );
  }, [session]);

  const normalizedRole = useMemo(() => normalizeRole(role), [role]);

  return useMemo(
    () => ({
      role,
      normalizedRole,
      isStaff: isStaffRole(role),
      isClient: isClientRole(role),
      showHomeTenant: shouldShowHomeTenant(role),
      showPublicHome: shouldShowPublicHome(role),
      displayName: role ? getRoleDisplayName(role) : null,
      isLoading,
      isAuthenticated,
    }),
    [role, normalizedRole, isLoading, isAuthenticated]
  );
}

/**
 * Simplified hook that just returns whether to show HomeTenant
 * Useful for components that only need the routing decision
 */
export function useShowHomeTenant(): boolean {
  const { showHomeTenant, isLoading } = useUserRole();

  // While loading, return false to prevent flash
  if (isLoading) return false;

  return showHomeTenant;
}

export default useUserRole;
