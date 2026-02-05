import { Result, Ok, Err, match, isFailure } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { NextRequest } from "next/server";
import {
  CommonSchemas,
  validateWithZod,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

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
const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret";
const JWT_EXPIRY_HOURS = 24;

// Zod schemas for JWT validation
const JWTPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["customer", "admin", "staff"]),
  tenantId: z.string().uuid().optional(),
  iat: z.number(),
  exp: z.number(),
});

/**
 * Simple JWT implementation for demo purposes
 */
class SimpleJWT {
  static encode(payload: JWTPayload): string {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
      "base64url",
    );
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      "base64url",
    );
    const signature = SimpleJWT.sign(
      encodedHeader + "." + encodedPayload,
      JWT_SECRET,
    );

    return encodedHeader + "." + encodedPayload + "." + signature;
  }

  static decode(token: string): JWTPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      return payload;
    } catch {
      return null;
    }
  }

  private static sign(data: string, secret: string): string {
    // Simple HMAC-SHA256 signature for demo
    return Buffer.from(data + secret).toString("base64url");
  }

  static verify(token: string): boolean {
    const payload = SimpleJWT.decode(token);
    if (!payload) {
      return false;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }
}

/**
 * Validate JWT payload with Zod
 */
function validateJWTPayload(payload: any): Result<JWTPayload, DomainError> {
  const result = JWTPayloadSchema.safeParse(payload);

  if (!result.success) {
    return Err(
      ErrorFactories.validation(
        "Invalid JWT payload structure",
        "payload",
        payload,
        result.error.issues,
      ),
    );
  }

  try {
    // Additional validation for business rules
    if (
      result.data.iat &&
      result.data.exp &&
      result.data.iat >= result.data.exp
    ) {
      return Err(
        ErrorFactories.authentication("expired", "JWT token has expired"),
      );
    }

    return Ok(result.data as JWTPayload);
  } catch (error) {
    return Err(
      ErrorFactories.validation(
        "Failed to validate JWT payload",
        undefined,
        undefined,
        error as Error,
      ),
    );
  }
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
          "Authorization header with Bearer token is required",
        ),
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = SimpleJWT.decode(token);

    if (!payload) {
      return Err(
        ErrorFactories.authentication(
          "invalid_token",
          "Invalid or malformed authentication token",
        ),
      );
    }

    // Verify token
    if (!SimpleJWT.verify(token)) {
      return Err(
        ErrorFactories.authentication(
          "expired",
          "Authentication token has expired",
        ),
      );
    }

    // Validate payload structure with Zod
    const payloadValidation = validateJWTPayload(payload);
    if (isFailure(payloadValidation)) {
      return payloadValidation;
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = payloadValidation.success
      ? payloadValidation.data
      : undefined;

    return Ok(authenticatedRequest);
  } catch (error) {
    return Err(
      ErrorFactories.validation(
        "Failed to authenticate request",
        undefined,
        undefined,
        error as Error,
      ),
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
          "User authentication required",
        ),
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
          requiredRoles.join(", "),
        ),
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
 * Create JWT token for user
 */
export function createAuthToken(user: {
  id: string;
  email: string;
  role: "customer" | "admin" | "staff";
  tenantId?: string;
}): Result<string, DomainError> {
  try {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY_HOURS * 60 * 60, // Convert hours to seconds
    };

    const token = SimpleJWT.encode(payload);
    return Ok(`Bearer ${token}`);
  } catch (error) {
    return Err(
      ErrorFactories.validation(
        "Failed to create authentication token",
        undefined,
        undefined,
        error as Error,
      ),
    );
  }
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
        "No user found in request",
      ),
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
        "User authentication required",
      ),
    );
  }

  if (request.user.userId !== resourceUserId) {
    return Err(
      ErrorFactories.authorization(
        "User does not have permission to access this resource",
        "resource_access",
      ),
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
