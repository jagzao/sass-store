import { useEffect, useState } from "react";
import { getTenantSlugFromPath } from "./tenant-store";

// Hook for client-side tenant resolution
export function useTenantSlug(): string {
  const [tenantSlug, setTenantSlug] = useState("zo-system");

  useEffect(() => {
    // Only run on client side after hydration
    if (typeof window !== "undefined") {
      const slug = getTenantSlugFromPath();
      setTenantSlug(slug);
    }
  }, []);

  return tenantSlug;
}

// Non-hook utility function for SSR and non-React contexts
export function getTenantSlug(): string {
  return getTenantSlugFromPath();
}
