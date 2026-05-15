/**
 * Client-side API configuration
 * Use this in client components to get the API base URL
 */

export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalhost) return "";
    return process.env.NEXT_PUBLIC_API_URL || "";
  }

  // Server-side: check if DATABASE_URL or other env suggests local dev
  const isLocalServer =
    (process.env.DATABASE_URL || "").includes("localhost") ||
    (process.env.DATABASE_URL || "").includes("127.0.0.1") ||
    (process.env.NEXTAUTH_URL || "").includes("localhost") ||
    (process.env.NEXTAUTH_URL || "").includes("127.0.0.1");
  if (isLocalServer) return "";

  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";
}

/**
 * Build full API URL from a path
 * Note: Web app uses internal endpoints, this is for client-side API calls if needed
 * @example
 * buildApiUrl('/api/tenants/wondernails') // => 'https://sass-store-web.vercel.app/api/tenants/wondernails'
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiUrl();
  // Remove leading slash from path if baseUrl already has trailing slash
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
