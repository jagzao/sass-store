"use client";

/**
 * HomeRouter Component
 *
 * Client component for role-based home selection.
 * Determines whether to show the public home or HomeTenant dashboard
 * based on the user's role.
 *
 * Routing Logic:
 * - No session / Cliente role => Public Home (existing behavior)
 * - Admin / Gerente / Personal role => HomeTenant Dashboard
 */

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { shouldShowHomeTenant, normalizeRole } from "@/lib/auth/role-guards";
import HomeTenant from "./HomeTenant";

export interface HomeRouterProps {
  /** Tenant slug for data fetching */
  tenantSlug: string;
  /** Tenant data for public home */
  tenantData: any;
  /** Existing public home content (passed as children) */
  publicHomeContent: React.ReactNode;
  /** Optional class name for container */
  className?: string;
}

/**
 * Router component that selects between public home and HomeTenant
 * based on user role
 */
export default function HomeRouter({
  tenantSlug,
  tenantData,
  publicHomeContent,
  className,
}: HomeRouterProps) {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  // Extract role from session
  const role = useMemo(() => {
    if (!session?.user) return null;
    const user = session.user as any;
    return (
      user.role ||
      user.userRole ||
      user.tenantRole ||
      user.permissions?.role ||
      null
    );
  }, [session]);

  // Show loading state to prevent flash
  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-white ${className || ""}`}
      >
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-200" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Determine which home to show
  const showHomeTenant = shouldShowHomeTenant(role);

  // Staff roles get HomeTenant dashboard
  if (showHomeTenant && isAuthenticated) {
    return (
      <div data-testid="hometenant-dashboard" className={className}>
        <HomeTenant tenantSlug={tenantSlug} tenantData={tenantData} />
      </div>
    );
  }

  // Unauthenticated or client users get public home
  return (
    <div data-testid="public-home" className={className}>
      {publicHomeContent}
    </div>
  );
}
