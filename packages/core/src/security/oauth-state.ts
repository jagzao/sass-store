import crypto from 'crypto';
import { db } from '@sass-store/database';
import { oauthStateTokens } from '@sass-store/database/schema';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Generate a secure OAuth state token to prevent CSRF attacks
 * @param tenantId The tenant initiating the OAuth flow
 * @param provider The OAuth provider (e.g., 'mercadopago', 'google')
 * @returns The generated state token
 */
export async function generateOAuthState(
  tenantId: string,
  provider: string
): Promise<string> {
  // Generate a cryptographically secure random state token
  const state = crypto.randomBytes(32).toString('hex');

  // Set expiration to 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Store in database
  await db.insert(oauthStateTokens).values({
    state,
    tenantId,
    provider,
    used: false,
    expiresAt,
  });

  return state;
}

/**
 * Validate an OAuth state token and return the associated tenant ID
 * @param state The state token to validate
 * @param provider The expected OAuth provider
 * @returns The tenant ID if valid, null otherwise
 */
export async function validateOAuthState(
  state: string,
  provider: string
): Promise<string | null> {
  if (!state) {
    console.warn('[OAuth] Missing state parameter');
    return null;
  }

  try {
    // Find the state token
    const [stateRecord] = await db
      .select()
      .from(oauthStateTokens)
      .where(
        and(
          eq(oauthStateTokens.state, state),
          eq(oauthStateTokens.provider, provider),
          eq(oauthStateTokens.used, false),
          gt(oauthStateTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!stateRecord) {
      console.warn('[OAuth] Invalid, expired, or already used state token');
      return null;
    }

    // Mark as used to prevent replay attacks
    await db
      .update(oauthStateTokens)
      .set({ used: true })
      .where(eq(oauthStateTokens.id, stateRecord.id));

    return stateRecord.tenantId;
  } catch (error) {
    console.error('[OAuth] Error validating state token:', error);
    return null;
  }
}

/**
 * Clean up expired OAuth state tokens
 * Should be called periodically
 */
export async function cleanupExpiredOAuthStates(): Promise<void> {
  try {
    const result = await db
      .delete(oauthStateTokens)
      .where(and(
        gt(new Date(), oauthStateTokens.expiresAt)
      ));

    console.log('[OAuth] Cleaned up expired state tokens');
  } catch (error) {
    console.error('[OAuth] Error cleaning up state tokens:', error);
  }
}
