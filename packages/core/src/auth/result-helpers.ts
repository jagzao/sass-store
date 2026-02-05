/**
 * Authentication Helpers with Result Pattern
 *
 * Provides common authentication and authorization utilities using Result pattern.
 * This replaces traditional auth checks with type-safe Result handling.
 */

import { NextRequest } from "next/server";
import { Result, Ok, Err, flatMap, pipe } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

// Auth token schema
export const AuthTokenSchema = z.object({
  token: z.string().min(1),
  type: z.enum(["bearer", "session", "api"]),
});

// Credentials schema
export const CredentialsSchema = z.object({
  email: CommonSchemas.email.getSchema(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// User session schema
export const UserSessionSchema = z.object({
  userId: z.string().uuid(),
  email: CommonSchemas.email.getSchema(),
  tenantId: z.string().uuid(),
  role: z.enum(["admin", "user", "readonly"]),
  permissions: z.array(z.string()),
  expiresAt: z.string().datetime(),
});

// Types
export interface AuthToken {
  token: string;
  type: "bearer" | "session" | "api";
}

export interface Credentials {
  email: string;
  password: string;
}

export interface UserSession {
  userId: string;
  email: string;
  tenantId: string;
  role: "admin" | "user" | "readonly";
  permissions: string[];
  expiresAt: string;
}

export interface AuthContext {
  user: UserSession;
  sessionId: string;
  isAuthenticated: true;
}

/**
 * Extract and validate auth token from request
 */
export const extractAuthToken = (
  request: NextRequest,
): Result<AuthToken, DomainError> => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return Err(
      ErrorFactories.authentication(
        "missing_token",
        "Authorization header is required",
      ),
    );
  }

  const [type, token] = authHeader.split(" ");

  if (!type || !token) {
    return Err(
      ErrorFactories.authentication(
        "invalid_token",
        "Invalid authorization header format",
      ),
    );
  }

  const tokenValidation = validateWithZod(AuthTokenSchema, {
    token,
    type: type.toLowerCase() as "bearer",
  });

  if (!tokenValidation.success) {
    return Err(
      ErrorFactories.authentication("invalid_token", "Invalid token format"),
    );
  }

  return Ok(tokenValidation.data);
};

/**
 * Parse and validate credentials from request body
 */
export const parseCredentials = async (
  request: NextRequest,
): Promise<Result<Credentials, DomainError>> => {
  try {
    const body = await request.json();
    const validation = validateWithZod(CredentialsSchema, body);

    return validation.success
      ? Ok(validation.data)
      : Err(
          ErrorFactories.validation(
            "Invalid credentials format",
            undefined,
            body,
            validation.error.details,
          ),
        );
  } catch (error) {
    return Err(
      ErrorFactories.validation(
        "Failed to parse credentials",
        undefined,
        undefined,
        error,
      ),
    );
  }
};

/**
 * Validate session is not expired
 */
export const validateSession = (
  session: UserSession,
): Result<UserSession, DomainError> => {
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);

  if (now > expiresAt) {
    return Err(ErrorFactories.authentication("expired", "Session has expired"));
  }

  return Ok(session);
};

/**
 * Check if user has required permissions
 */
export const checkPermissions = (
  userPermissions: string[],
  requiredPermissions: string[],
): Result<boolean, DomainError> => {
  const hasAllPermissions = requiredPermissions.every((perm) =>
    userPermissions.includes(perm),
  );

  if (!hasAllPermissions) {
    const missing = requiredPermissions.filter(
      (perm) => !userPermissions.includes(perm),
    );

    return Err(
      ErrorFactories.authorization(
        `Insufficient permissions. Missing: ${missing.join(", ")}`,
        missing.join(", "),
      ),
    );
  }

  return Ok(true);
};

/**
 * Validate user can access tenant
 */
export const validateTenantAccess = (
  userTenantId: string,
  requestedTenantId: string,
): Result<boolean, DomainError> => {
  if (userTenantId !== requestedTenantId) {
    return Err(
      ErrorFactories.authorization(
        "Cannot access different tenant",
        "tenant_access",
      ),
    );
  }

  return Ok(true);
};

/**
 * Complete authentication flow
 */
export const authenticateUser = async (
  request: NextRequest,
  validateCredentials: (
    email: string,
    password: string,
  ) => Promise<Result<UserSession, DomainError>>,
): Promise<Result<AuthContext, DomainError>> => {
  // Extract and validate credentials
  const credentialsResult = await parseCredentials(request);
  if (!credentialsResult.success) {
    return Err(credentialsResult.error);
  }

  const { email, password } = credentialsResult.data;

  // Validate credentials against auth service
  const sessionResult = await validateCredentials(email, password);
  if (!sessionResult.success) {
    return Err(sessionResult.error);
  }

  // Validate session is not expired
  const validSessionResult = validateSession(sessionResult.data);
  if (!validSessionResult.success) {
    return Err(validSessionResult.error);
  }

  // Generate session ID
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return Ok({
    user: validSessionResult.data,
    sessionId,
    isAuthenticated: true,
  });
};

/**
 * Validate API key
 */
export const validateApiKey = (
  request: NextRequest,
  validateKey: (apiKey: string) => Promise<Result<UserSession, DomainError>>,
): Promise<Result<AuthContext, DomainError>> => {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return Err(
      ErrorFactories.authentication("missing_token", "API key is required"),
    );
  }

  const sessionResult = await validateKey(apiKey);
  if (!sessionResult.success) {
    return Err(sessionResult.error);
  }

  const sessionId = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return Ok({
    user: sessionResult.data,
    sessionId,
    isAuthenticated: true,
  });
};

/**
 * Get user context from request (token or API key)
 */
export const getUserContext = async (
  request: NextRequest,
  options: {
    allowApiKey?: boolean;
    validateToken?: (
      token: string,
    ) => Promise<Result<UserSession, DomainError>>;
    validateKey?: (apiKey: string) => Promise<Result<UserSession, DomainError>>;
  } = {},
): Promise<Result<AuthContext, DomainError>> => {
  const { allowApiKey = false, validateToken, validateKey } = options;

  // Try API key first if allowed
  if (allowApiKey && validateKey) {
    const apiKeyHeader = request.headers.get("x-api-key");
    if (apiKeyHeader) {
      return await validateApiKey(request, validateKey);
    }
  }

  // Fall back to bearer token
  if (!validateToken) {
    return Err(
      ErrorFactories.configuration(
        "validate_token",
        "Token validation function is required",
      ),
    );
  }

  const tokenResult = extractAuthToken(request);
  if (!tokenResult.success) {
    return Err(tokenResult.error);
  }

  const sessionResult = await validateToken(tokenResult.data.token);
  if (!sessionResult.success) {
    return Err(sessionResult.error);
  }

  const validSessionResult = validateSession(sessionResult.data);
  if (!validSessionResult.success) {
    return Err(validSessionResult.error);
  }

  const sessionId = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return Ok({
    user: validSessionResult.data,
    sessionId,
    isAuthenticated: true,
  });
};

/**
 * Middleware for authentication
 */
export const withAuth = <T>(
  request: NextRequest,
  authOptions: {
    allowApiKey?: boolean;
    requiredPermissions?: string[];
    validateToken?: (
      token: string,
    ) => Promise<Result<UserSession, DomainError>>;
    validateKey?: (apiKey: string) => Promise<Result<UserSession, DomainError>>;
  },
  handler: (context: AuthContext) => Promise<Result<T, DomainError>>,
): Promise<Result<T, DomainError>> => {
  return pipe(getUserContext(request, authOptions)).flatMap(
    async (authContext) => {
      // Check required permissions
      if (authOptions.requiredPermissions) {
        const permissionResult = checkPermissions(
          authContext.user.permissions,
          authOptions.requiredPermissions,
        );

        if (!permissionResult.success) {
          return permissionResult;
        }
      }

      return handler(authContext);
    },
  );
};

/**
 * Create session response
 */
export const createSessionResponse = (authContext: AuthContext) => {
  return {
    success: true,
    data: {
      sessionId: authContext.sessionId,
      user: {
        id: authContext.user.userId,
        email: authContext.user.email,
        role: authContext.user.role,
        permissions: authContext.user.permissions,
      },
      expiresAt: authContext.user.expiresAt,
    },
  };
};

/**
 * Rate limit authentication attempts
 */
export const createAuthRateLimit = (identifier: string) => {
  // TODO: Implement actual rate limiting (Redis, etc.)
  return {
    isAllowed: true,
    remaining: 5,
    resetAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  };
};
