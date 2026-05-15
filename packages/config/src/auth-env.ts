/**
 * Lightweight env checks for auth UI / provider registration.
 * Keep this module free of DB or NextAuth side effects.
 */
export function isGoogleOAuthConfigured(): boolean {
  const id = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  if (!id || !secret) return false;
  // Playwright / CI uses mock credentials so the route still registers.
  if (id === "mock_client_id_for_testing") return true;
  const placeholder =
    /^your_/i.test(id) ||
    /^your_/i.test(secret) ||
    id === "your_google_client_id" ||
    secret === "your_google_client_secret";
  if (placeholder) return false;
  return true;
}
