"use client";

/**
 * HomeRouterWrapper Component
 *
 * Client wrapper that provides SessionProvider for HomeRouter.
 * Required because HomeRouter uses useSession hook.
 */

import { SessionProvider } from "next-auth/react";
import HomeRouter from "./HomeRouter";

export interface HomeRouterWrapperProps {
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
 * Wrapper component that provides session context to HomeRouter
 */
export default function HomeRouterWrapper({
  tenantSlug,
  tenantData,
  publicHomeContent,
  className,
}: HomeRouterWrapperProps) {
  return (
    <SessionProvider>
      <HomeRouter
        tenantSlug={tenantSlug}
        tenantData={tenantData}
        publicHomeContent={publicHomeContent}
        className={className}
      />
    </SessionProvider>
  );
}
