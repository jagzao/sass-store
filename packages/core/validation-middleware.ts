/**
 * Request validation middleware for API endpoints
 * Provides input validation and sanitization for all API requests
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { sanitizeOptionalHtml } from "@sass-store/validation";

export interface ValidationErrorResponse {
  success: false;
  error: {
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface ValidationSuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * Creates a validation middleware function for the given schema
 */
export function createValidationMiddleware<T>(schema: ZodSchema<T>) {
  return async (
    request: NextRequest,
    context?: any,
  ): Promise<
    NextResponse<ValidationErrorResponse | ValidationSuccessResponse<T>>
  > => {
    try {
      // Parse the request body
      const body = await request.json();

      // Validate the body against the schema
      const validatedData = schema.parse(body);

      // Store validated data in the context for use in the route handler
      if (context) {
        context.validatedData = validatedData;
      }

      // Return success response with validated data
      return NextResponse.json({
        success: true,
        data: validatedData,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const errorDetails = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return NextResponse.json(
          {
            success: false,
            error: {
              message: "Validation failed",
              details: errorDetails,
            },
          },
          { status: 400 },
        );
      }

      // Handle other errors
      console.error("Validation middleware error:", error);

      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Internal server error during validation",
          },
        },
        { status: 500 },
      );
    }
  };
}

/**
 * Higher-order function to wrap API route handlers with validation
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (
    request: NextRequest,
    context: { validatedData: T; params?: any },
  ) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context: { params?: any }) => {
    // First, validate the request
    const validationResult = await createValidationMiddleware(schema)(
      request,
      context,
    );

    // If validation failed, return the error response
    if (!validationResult.ok) {
      return validationResult;
    }

    // Extract the validated data
    const { data } = await validationResult.json();

    // Call the original handler with the validated data
    return handler(request, { ...context, validatedData: data });
  };
}

/**
 * Sanitizes request headers to prevent header injection attacks
 */
export function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {};

  headers.forEach((value, key) => {
    // Skip potentially dangerous headers
    if (
      key.toLowerCase().startsWith("x-") ||
      key.toLowerCase().includes("cookie") ||
      key.toLowerCase().includes("authorization")
    ) {
      // Basic sanitization for sensitive headers
      sanitized[key] = value.replace(/[\r\n]/g, "");
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * Validates and sanitizes query parameters
 */
export function validateQueryParams(
  searchParams: URLSearchParams,
  schema: Record<string, ZodSchema<any>>,
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, valueSchema] of Object.entries(schema)) {
    const value = searchParams.get(key);

    if (value !== null) {
      try {
        result[key] = valueSchema.parse(value);
      } catch (error) {
        throw new Error(
          `Invalid query parameter '${key}': ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  }

  return result;
}

/**
 * Security checks for incoming requests
 */
export function securityCheck(request: NextRequest): {
  valid: boolean;
  reason?: string;
} {
  // Check for suspicious user agents
  const userAgent = request.headers.get("user-agent") || "";
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scanner/i,
    /test/i,
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(userAgent))) {
    return { valid: false, reason: "Suspicious user agent" };
  }

  // Check for suspicious headers
  const suspiciousHeaders = [
    "x-forwarded-for",
    "x-real-ip",
    "x-originating-ip",
  ];

  for (const header of suspiciousHeaders) {
    const value = request.headers.get(header);
    if (value && value.includes(",")) {
      // Multiple IPs in header might indicate proxy chaining
      return { valid: false, reason: "Suspicious proxy header" };
    }
  }

  // Check for large content length
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const length = parseInt(contentLength, 10);
    if (length > 10 * 1024 * 1024) {
      // 10MB limit
      return { valid: false, reason: "Request too large" };
    }
  }

  return { valid: true };
}

/**
 * Rate limiting check wrapper
 */
export async function withRateLimit<T>(
  identifier: string,
  handler: () => Promise<T>,
  limit: number = 100,
  window: string = "1h",
): Promise<T> {
  try {
    // This would integrate with your rate limiting system
    // For now, we'll just call the handler
    return await handler();
  } catch (error) {
    if (error instanceof Error && error.message.includes("rate limit")) {
      throw new Error("Too many requests. Please try again later.");
    }
    throw error;
  }
}

/**
 * Combined security middleware
 */
export async function securityMiddleware(
  request: NextRequest,
): Promise<NextResponse | null> {
  // Perform security checks
  const securityResult = securityCheck(request);
  if (!securityResult.valid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Security check failed",
          reason: securityResult.reason,
        },
      },
      { status: 400 },
    );
  }

  // Note: We cannot modify the NextRequest object directly
  // The sanitization should be done when reading headers in the route handlers

  return null; // Continue to the next handler
}
