import { Result, Ok, Err, match, isFailure } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { NextRequest } from "next/server";
import {
  CommonSchemas,
  validateWithZod,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { SignJWT, jwtVerify, JWTPayloadParsed } from "jose";

// Types for JWT
export interface JWTPayload {
  userId: string;
  email: string;
  role: "customer" | "admin" | "staff";
  tenantId?: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

// JWT configuration
const JWT_SECRET_ENV = process.env.JWT_SECRET;
const JWT_EXPIRY_HOURS = 24;

// Minimum secret length for HS256 (256 bits = 32 bytes)
const MIN_SECRET_LENGTH = 32;

/**
 * Get and validate JWT secret from environment
 * SECURITY: Never use fallback secrets in production
 */
function getJWTSecret(): Result<Uint8Array, DomainError> {
  if (!JWT_SECRET_ENV) {
    if (process.env.NODE_ENV === "production") {
      return Err(
        ErrorFactories.configuration(
          "JWT_SECRET environment variable is required in production",
          "JWT_SECRET"
        )
      );
    }
    // Development only - use a deterministic dev secret for consistency
    console.warn(
      "⚠️ WARNING: Using development JWT secret. Set JWT_SECRET environment variable for production."
    );
    const devSecret = "dev-jwt-secret-do-not-use-in-production-min32ch";
    return Ok(new TextEncoder().encode(devSecret));
  }

  if (JWT_SECRET_ENV.length < MIN_SECRET_LENGTH) {
    return Err(
      ErrorFactories.validation(
        `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters for HS256 security`,
        "JWT_SECRET",
        undefined,
        undefined
      )
    );
  }

  return Ok(new TextEncoder().encode(JWT_SECRET_ENV));
}

// UUID validation regex (RFC 4122)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Zod schemas for JWT validation with strict userId UUID requirement
const JWTPayloadSchema = z.object({
  userId: z
    .string()
    .min(1)
    .refine((val) => UUID_REGEX.test(val) || val.startsWith("user_"), {
      message: "userId must be a valid UUID or start with 'user_' prefix",
    }),
  email: z.string().email(),
  role: z.enum(["customer", "admin", "staff"]),
  tenantId: z
    .string()
    .min(1)
    .refine((val) => UUID_REGEX.test(val) || val.startsWith("tenant_") || val.startsWith("user_"), {
      message: "tenantId must be a valid UUID or have a valid prefix",
    })
    .optional(),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
});

/**
 * Secure JWT Service using jose library with proper HMAC-SHA256 signing
 */
class SecureJWTService {
  private static algorithm = "HS256" as const;

  /**
   * Generate a cryptographically signed JWT token
   * Uses HMAC-SHA256 algorithm via jose library
   */
  static async generateToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<Result<string, DomainError>> {
    const secretResult = getJWTSecret();
    if (isFailure(secretResult)) {
      return secretResult;
    }

    try {
      const now = Math.floor(Date.now() / 1000);
      const fullPayload: JWTPayload = {
        ...payload,
        iat: now,
        exp: now + JWT_EXPIRY_HOURS * 60 * 60,
      };

      const token = await new SignJWT(fullPayload as any)
        .setProtectedHeader({ alg: this.algorithm })
        .setIssuedAt(now)
        .setExpirationTime(fullPayload.exp)
        .sign(secretResult.success ? secretResult.data : new Uint8Array());

      return Ok(token);
    } catch (error) {
      return Err(
        ErrorFactories.validation(
          "Failed to generate authentication token",
          undefined,
          undefined,
          error as Error
        )
      );
    }
  }

  /**
   * Verify and decode a JWT token with cryptographic signature validation
   * SECURITY: This properly verifies the HMAC-SHA256 signature
   */
  static async verifyToken(token: string): Promise<Result<JWTPayload, DomainError>> {
    const secretResult = getJWTSecret();
    if (isFailure(secretResult)) {
      return secretResult;
    }

    try {
      const { payload } = await jwtVerify(
        token,
        secretResult.success ? secretResult.data : new Uint8Array()
      );

      // Additional validation for our specific payload structure
      const validationResult = validateJWTPayload(payload);
      if (isFailure(validationResult)) {
        return validationResult;
      }

      return Ok(validationResult.success ? validationResult.data : undefined as any);
    } catch (error: any) {
      // Map jose errors to secure error messages (no internal details exposed)
      if (error?.code === "ERR_JWT_EXPIRED") {
        return Err(
          ErrorFactories.authentication("expired", "Authentication token has expired")
        );
      }
      if (error?.code === "ERR_JWT_SIGNATURE_MISMATCH") {
        return Err(
          ErrorFactories.authentication("invalid_signature", "Invalid authentication token")
        );
      }
      if (error?.code === "ERR_JWT_MALFORMED") {
        return Err(
          ErrorFactories.authentication("malformed", "Invalid authentication token")
        );
      }
      // Generic error for any other JWT issues - don't expose details
      return Err(
        ErrorFactories.authentication("invalid_token", "Invalid authentication token")
      );
    }
  }
}

/**
 * Validate JWT payload with Zod and business rules
 */
function validateJWTPayload(payload: unknown): Result<JWTPayload, DomainError> {
  const result = JWTPayloadSchema.safeParse(payload);

  if (!result.success) {
    return Err(
      ErrorFactories.validation(
        "Invalid JWT payload structure",
        "payload",
        undefined, // Don't expose actual payload
        result.error.issues
      )
    );
  }

  // Additional business rule validation
  if (result.data.iat >= result.data.exp) {
    return Err(
      ErrorFactories.authentication("invalid_token", "Invalid token timing")
    );
  }

  // Check if token is expired (double-check beyond jose's verification)
  const now = Math.floor(Date.now() / 1000);
  if (result.data.exp < now) {
    return Err(
      ErrorFactories.authentication("expired", "Authentication token has expired")
    );
  }

  return Ok(result.data);
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function authenticateRequest(
  request: NextRequest,
): Promise<Result<AuthenticatedRequest, DomainError>> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Err(
        ErrorFactories.authentication(
          "missing_token",
          "Authorization header with Bearer token is required"
        )
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Use secure JWT verification
    const verifyResult = await SecureJWTService.verifyToken(token);
    if (isFailure(verifyResult)) {
      return verifyResult;
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = verifyResult.success ? verifyResult.data : undefined;

    return Ok(authenticatedRequest);
  } catch (error) {
    return Err(
      ErrorFactories.validation(
        "Failed to authenticate request",
        undefined,
        undefined,
        error as Error
      )
    );
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(requiredRole: string | string[]) {
  return (request: AuthenticatedRequest): Result<void, DomainError> => {
    if (!request.user) {
      return Err(
        ErrorFactories.authentication(
          "missing_token",
          "User authentication required"
        )
      );
    }

    const userRole = request.user.role;
    const requiredRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];

    if (!requiredRoles.includes(userRole)) {
      return Err(
        ErrorFactories.authorization(
          `User role '${userRole}' is not authorized for this operation`,
          requiredRoles.join(", ")
        )
      );
    }

    return Ok(undefined);
  };
}

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole(["admin"]);

/**
 * Middleware to check if user is staff or admin
 */
export const requireStaff = requireRole(["admin", "staff"]);

/**
 * Create JWT token for user - ASYNC version with proper signing
 */
export async function createAuthToken(user: {
  id: string;
  email: string;
  role: "customer" | "admin" | "staff";
  tenantId?: string;
}): Promise<Result<string, DomainError>> {
  // Validate userId format before creating token
  if (!UUID_REGEX.test(user.id) && !user.id.startsWith("user_")) {
    return Err(
      ErrorFactories.validation(
        "Invalid user ID format - must be UUID or have valid prefix",
        "userId",
        undefined,
        undefined
      )
    );
  }

  return SecureJWTService.generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  });
}

/**
 * Legacy synchronous version for backward compatibility
 * @deprecated Use createAuthToken instead
 */
export function createAuthTokenSync(user: {
  id: string;
  email: string;
  role: "customer" | "admin" | "staff";
  tenantId?: string;
}): Result<string, DomainError> {
  // This is deprecated - log warning
  console.warn(
    "⚠️ createAuthTokenSync is deprecated. Use async createAuthToken instead."
  );
  
  // Return error indicating to use async version
  return Err(
    ErrorFactories.validation(
      "Synchronous token creation is deprecated. Use async createAuthToken instead.",
      undefined,
      undefined,
      undefined
    )
  );
}

/**
 * Verify a JWT token - Public API
 */
export async function verifyAuthToken(
  token: string
): Promise<Result<JWTPayload, DomainError>> {
  return SecureJWTService.verifyToken(token);
}

/**
 * Extract user from authenticated request
 */
export function getUserFromRequest(
  request: NextRequest,
): Result<JWTPayload, DomainError> {
  const authenticatedRequest = request as AuthenticatedRequest;

  if (!authenticatedRequest.user) {
    return Err(
      ErrorFactories.authentication(
        "missing_token",
        "No user found in request"
      )
    );
  }

  return Ok(authenticatedRequest.user);
}

/**
 * Check if user owns a resource
 */
export function checkResourceOwnership(
  request: AuthenticatedRequest,
  resourceUserId: string,
): Result<void, DomainError> {
  if (!request.user) {
    return Err(
      ErrorFactories.authentication(
        "missing_token",
        "User authentication required"
      )
    );
  }

  if (request.user.userId !== resourceUserId) {
    return Err(
      ErrorFactories.authorization(
        "User does not have permission to access this resource",
        "resource_access"
      )
    );
  }

  return Ok(undefined);
}

/**
 * Higher-order middleware that combines authentication with role checking
 */
export function withAuthAndRole(
  roleCheck: (request: AuthenticatedRequest) => Result<void, DomainError>,
) {
  return (handler: (request: NextRequest) => Promise<any>) => {
    return async (request: NextRequest) => {
      // Authenticate the request
      const authResult = await authenticateRequest(request);
      if (isFailure(authResult)) {
        return authResult;
      }

      // Check role permissions
      const roleResult = roleCheck(
        authResult.success
          ? authResult.data
          : (request as AuthenticatedRequest),
      );
      if (isFailure(roleResult)) {
        return roleResult;
      }

      // Proceed with the handler
      return handler(authResult.success ? authResult.data : request);
    };
  };
}

/**
 * Create a middleware that requires authentication
 */
export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<any>,
) {
  return withAuthAndRole(() => Ok(undefined))(handler);
}

/**
 * Create a middleware that requires admin role
 */
export const withAdminAuth = withAuthAndRole(requireAdmin);

/**
 * Create a middleware that requires staff or admin role
 */
export const withStaffAuth = withAuthAndRole(requireStaff);

/**
 * Middleware to extract user without authentication (for demo/testing)
 */
export function extractUserToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7);
}

// Re-export SecureJWTService for testing
export { SecureJWTService };
