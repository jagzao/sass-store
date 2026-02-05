/**
 * Result Pattern API Middleware
 *
 * Provides middleware and utilities for Next.js API routes using Result pattern.
 * This replaces traditional try/catch with type-safe Result handling.
 */

import { NextRequest, NextResponse } from "next/server";
import { Result, Ok, Err, match } from "../result";
import {
  DomainError,
  getHttpStatusCode,
  ErrorFactories,
} from "../errors/types";

// Enhanced API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    type?: string;
    details?: any;
    code?: string;
  };
  meta?: {
    requestId?: string;
    timestamp: string;
    version?: string;
  };
}

// Result handler options
export interface ResultHandlerOptions {
  includeRequestId?: boolean;
  includeTimestamp?: boolean;
  version?: string;
  logResults?: boolean;
  logger?: {
    info: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
    warn: (message: string, data?: any) => void;
  };
}

// Default options
const defaultOptions: Required<ResultHandlerOptions> = {
  includeRequestId: true,
  includeTimestamp: true,
  version: "1.0.0",
  logResults: true,
  logger: {
    info: console.log,
    error: console.error,
    warn: console.warn,
  },
};

// Generate request ID
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Main Result handler middleware
export const withResultHandler = <T, E extends DomainError>(
  handler: (request: NextRequest, context: any) => Promise<Result<T, E>>,
  options: ResultHandlerOptions = {},
) => {
  const opts = { ...defaultOptions, ...options };

  return async (
    request: NextRequest,
    context: any = {},
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const requestId = opts.includeRequestId ? generateRequestId() : undefined;
    const timestamp = opts.includeTimestamp
      ? new Date().toISOString()
      : undefined;

    try {
      const result = await handler(request, { ...context, requestId });

      return match(result, {
        ok: (data) => {
          const response: ApiResponse<T> = {
            success: true,
            data,
            meta: {
              requestId,
              timestamp,
              version: opts.version,
            },
          };

          if (opts.logResults) {
            opts.logger.info(`API request succeeded`, {
              requestId,
              url: request.url,
              method: request.method,
            });
          }

          return NextResponse.json(response);
        },
        err: (error) => {
          const statusCode = getHttpStatusCode(error);
          const response: ApiResponse = {
            success: false,
            error: {
              message: error.message,
              type: error.type,
              details: error.details,
              code: (error as any).code,
            },
            meta: {
              requestId,
              timestamp,
              version: opts.version,
            },
          };

          if (opts.logResults) {
            opts.logger.error(`API request failed`, {
              requestId,
              url: request.url,
              method: request.method,
              error: error.message,
              errorType: error.type,
              statusCode,
            });
          }

          return NextResponse.json(response, { status: statusCode });
        },
      });
    } catch (unexpectedError) {
      // Handle unexpected errors
      const domainError = ErrorFactories.database(
        "unexpected_error",
        unexpectedError instanceof Error
          ? unexpectedError.message
          : "Unexpected error",
        undefined,
        unexpectedError instanceof Error ? unexpectedError : undefined,
      );

      const response: ApiResponse = {
        success: false,
        error: {
          message: "Internal server error",
          type: domainError.type,
          details:
            process.env.NODE_ENV === "development"
              ? domainError.details
              : undefined,
        },
        meta: {
          requestId,
          timestamp,
          version: opts.version,
        },
      };

      if (opts.logResults) {
        opts.logger.error(`Unexpected error in API handler`, {
          requestId,
          url: request.url,
          method: request.method,
          error: unexpectedError,
        });
      }

      return NextResponse.json(response, { status: 500 });
    }
  };
};

// Validation middleware for Zod schemas
export const withValidation = <T, E extends DomainError>(
  schema: {
    safeParse: (data: unknown) => { success: boolean; data?: T; error?: any };
  },
  handler: (
    request: NextRequest,
    context: any,
    validatedData: T,
  ) => Promise<Result<any, E>>,
  options: ResultHandlerOptions = {},
) => {
  return withResultHandler(async (request, context) => {
    try {
      const body = await request.json();
      const validation = schema.safeParse(body);

      if (!validation.success) {
        return Err(
          ErrorFactories.validation(
            "Request validation failed",
            undefined,
            body,
            validation.error,
          ) as E,
        );
      }

      return handler(request, context, validation.data);
    } catch (error) {
      return Err(
        ErrorFactories.validation(
          "Failed to parse request body",
          undefined,
          undefined,
          error,
        ) as E,
      );
    }
  }, options);
};

// Query parameter validation
export const withQueryValidation = <T, E extends DomainError>(
  schema: Record<string, (value: string | null) => Result<T, DomainError>>,
  handler: (
    request: NextRequest,
    context: any,
    queryData: T,
  ) => Promise<Result<any, E>>,
  options: ResultHandlerOptions = {},
) => {
  return withResultHandler(async (request, context) => {
    const { searchParams } = new URL(request.url);
    const queryResults: Result<any, DomainError>[] = [];

    for (const [key, validator] of Object.entries(schema)) {
      const result = validator(searchParams.get(key));
      queryResults.push(result);
    }

    // Combine all query validations
    for (const result of queryResults) {
      if (!result.success) {
        return result as Result<any, E>;
      }
    }

    const queryData = queryResults.reduce((acc, result) => {
      if (result.success) {
        return { ...acc, ...result.data };
      }
      return acc;
    }, {});

    return handler(request, context, queryData);
  }, options);
};

// Rate limiting middleware
export const withRateLimit = <T, E extends DomainError>(
  identifier: string,
  handler: (request: NextRequest, context: any) => Promise<Result<T, E>>,
  options: { limit: number; window: string } & ResultHandlerOptions = {
    limit: 100,
    window: "1h",
  },
) => {
  return withResultHandler(async (request, context) => {
    // TODO: Implement actual rate limiting (Redis, in-memory, etc.)
    // For now, just call the handler

    // Example implementation would check rate limits here
    // const isAllowed = await checkRateLimit(identifier, options.limit, options.window);
    // if (!isAllowed) {
    //   return Err(ErrorFactories.rateLimit(options.limit, options.window));
    // }

    return handler(request, context);
  }, options);
};

// Authentication middleware wrapper
export const withAuth = <T, E extends DomainError>(
  authValidator: (
    request: NextRequest,
  ) => Promise<Result<{ userId: string; tenantId: string }, DomainError>>,
  handler: (
    request: NextRequest,
    context: any,
    auth: { userId: string; tenantId: string },
  ) => Promise<Result<T, E>>,
  options: ResultHandlerOptions = {},
) => {
  return withResultHandler(async (request, context) => {
    const authResult = await authValidator(request);

    if (!authResult.success) {
      return authResult as Result<any, E>;
    }

    return handler(request, context, authResult.data);
  }, options);
};

// Permission checking middleware
export const withPermissions = <T, E extends DomainError>(
  requiredPermissions: string[],
  checkPermissions: (
    userId: string,
    tenantId: string,
    permissions: string[],
  ) => Promise<Result<boolean, DomainError>>,
  handler: (
    request: NextRequest,
    context: any,
    auth: { userId: string; tenantId: string },
  ) => Promise<Result<T, E>>,
  options: ResultHandlerOptions = {},
) => {
  return withAuth(
    async (request) => {
      // Extract auth info from request (this would be implemented based on your auth system)
      const authHeader = request.headers.get("Authorization");
      if (!authHeader) {
        return Err(ErrorFactories.authentication("missing_token"));
      }

      // Mock implementation - replace with your actual auth logic
      return Ok({ userId: "user-123", tenantId: "tenant-123" });
    },
    async (request, context, auth) => {
      const permissionResult = await checkPermissions(
        auth.userId,
        auth.tenantId,
        requiredPermissions,
      );

      if (!permissionResult.success) {
        return permissionResult as Result<any, E>;
      }

      if (!permissionResult.data) {
        return Err(
          ErrorFactories.authorization(
            `Insufficient permissions. Required: ${requiredPermissions.join(", ")}`,
            requiredPermissions.join(", "),
            auth.userId,
          ),
        ) as Result<any, E>;
      }

      return handler(request, context, auth);
    },
    options,
  );
};

// Health check endpoint helper
export const healthCheck = (
  checks: Record<string, () => Promise<boolean>>,
  options: ResultHandlerOptions = {},
) => {
  return withResultHandler(async () => {
    const results: Record<string, boolean> = {};
    const errors: DomainError[] = [];

    for (const [name, check] of Object.entries(checks)) {
      try {
        results[name] = await check();
      } catch (error) {
        errors.push(
          ErrorFactories.database(
            "health_check_failed",
            `Health check ${name} failed`,
            undefined,
            error instanceof Error ? error : undefined,
          ),
        );
      }
    }

    if (errors.length > 0) {
      return Err(errors[0]); // Return first error
    }

    return Ok({
      status: "healthy",
      checks: results,
      timestamp: new Date().toISOString(),
    });
  }, options);
};

// Utility to convert legacy functions to Result pattern
export const wrapLegacyHandler = async <T>(
  legacyHandler: () => Promise<T>,
): Promise<Result<T, DomainError>> => {
  try {
    const result = await legacyHandler();
    return Ok(result);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "legacy_handler_error",
        error instanceof Error ? error.message : "Legacy handler failed",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    ) as Result<T, DomainError>;
  }
};
