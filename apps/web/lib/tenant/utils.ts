/**
 * Utility functions for tenant-related operations
 */

/**
 * Extract tenant slug from a URL
 * @param url The URL to extract tenant from
 * @returns The tenant slug or null if not found
 */
export function getTenantFromUrl(url: string): string | null {
  try {
    // Handle relative URLs
    if (url.startsWith("/")) {
      // Check if it's a tenant URL pattern: /t/{tenant}/...
      const tenantMatch = url.match(/^\/t\/([^\/]+)/);
      if (tenantMatch) {
        return tenantMatch[1];
      }
      return null;
    }

    // Handle absolute URLs
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Check if it's a tenant URL pattern: /t/{tenant}/...
    const tenantMatch = pathname.match(/^\/t\/([^\/]+)/);
    if (tenantMatch) {
      return tenantMatch[1];
    }

    // Check subdomain pattern: {tenant}.domain.com
    const hostname = urlObj.hostname;
    const parts = hostname.split(".");

    if (parts.length > 2) {
      const potentialTenant = parts[0];
      // Skip common subdomains like www, api, etc.
      if (!["www", "api", "app", "admin"].includes(potentialTenant)) {
        return potentialTenant;
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting tenant from URL:", error);
    return null;
  }
}

/**
 * Build a tenant-specific URL
 * @param tenantSlug The tenant slug
 * @param path The path to append (without leading slash)
 * @returns The complete tenant-specific URL
 */
export function buildTenantUrl(tenantSlug: string, path: string = ""): string {
  const basePath = `/t/${tenantSlug}`;
  return path ? `${basePath}/${path.replace(/^\//, "")}` : basePath;
}

/**
 * Check if a URL is a tenant-specific URL
 * @param url The URL to check
 * @returns True if the URL is tenant-specific
 */
export function isTenantUrl(url: string): boolean {
  return getTenantFromUrl(url) !== null;
}
