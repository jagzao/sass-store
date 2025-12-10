/**
 * Client-side API configuration
 * Use this in client components to get the API base URL
 */

export function getApiUrl(): string {
  // In production, use the API URL from environment variable
  if (typeof window !== "undefined") {
    // Client-side: use NEXT_PUBLIC_API_URL
    return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";
  }

  // Server-side fallback (shouldn't be used, but just in case)
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:4000"
  );
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
