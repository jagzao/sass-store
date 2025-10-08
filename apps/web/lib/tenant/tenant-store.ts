import { atom } from "jotai";

// Define the atom for tenant slug with default value
export const tenantSlugAtom = atom<string>("zo-system");

// Derived atom to get tenant data (can be extended later for full tenant object)
export const tenantDataAtom = atom((get) => {
  const slug = get(tenantSlugAtom);
  return { slug };
});

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
