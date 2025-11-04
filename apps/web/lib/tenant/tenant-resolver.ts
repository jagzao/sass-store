// Utility to get tenant context from various sources
export function getTenantContext(): string {
  if (typeof window !== 'undefined') {
    // Client-side: extract tenant from URL path
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 't' && pathParts[2]) {
      // Clean the tenant slug by removing potential trailing slashes or query params
      return pathParts[2].split('/')[0].split('?')[0];
    }
  }
  
  // Default fallback
  return 'zo-system';
}