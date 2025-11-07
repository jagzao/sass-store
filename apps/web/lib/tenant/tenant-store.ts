import { create } from "zustand";

interface TenantStore {
  slug: string;
  setSlug: (slug: string) => void;
}

// Create Zustand store for tenant state
export const useTenantStore = create<TenantStore>((set) => ({
  slug: "zo-system",
  setSlug: (slug: string) => set({ slug }),
}));

// Server-side safe tenant resolver (no hooks)
export function getTenantSlugFromPath(pathname?: string): string {
  if (typeof window === "undefined") {
    // Server-side: extract from pathname
    if (pathname) {
      const segments = pathname.split("/");
      if (segments[1] === "t" && segments[2]) {
        return segments[2];
      }
    }
    return "zo-system";
  }

  // Client-side: extract from current location
  const path = window.location.pathname;
  const segments = path.split("/");
  if (segments[1] === "t" && segments[2]) {
    return segments[2];
  }

  // Check query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const tenantQuery = searchParams.get("tenant");
  if (tenantQuery) {
    return tenantQuery;
  }

  return "zo-system";
}

// Header resolver - uses middleware x-tenant header if available
export function getTenantSlugFromHeaders(headers?: Headers): string {
  if (headers && headers.get("x-tenant")) {
    return headers.get("x-tenant") || "zo-system";
  }
  return "zo-system";
}
