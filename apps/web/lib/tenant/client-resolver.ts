"use client";

import { useEffect, useState } from "react";
import { getTenantSlugFromPath } from "./tenant-store";
import { usePathname } from "next/navigation";

// Hook for client-side tenant resolution
export function useTenantSlug(): string {
  const pathname = usePathname();
  const [tenantSlug, setTenantSlug] = useState(() =>
    getTenantSlugFromPath(pathname),
  );

  useEffect(() => {
    setTenantSlug(getTenantSlugFromPath(pathname));
  }, [pathname]);

  return tenantSlug;
}

// Non-hook utility function for SSR and non-React contexts
export function getTenantSlug(): string {
  // This version is for client-side components that are not using the hook
  return getTenantSlugFromPath();
}