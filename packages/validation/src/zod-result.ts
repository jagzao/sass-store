/**
 * Zod Integration with Result Pattern
 *
 * Provides seamless integration between Zod schemas and Result pattern.
 * This replaces traditional Zod validation with type-safe Result handling.
 */

import { z, ZodSchema, ZodError } from "zod";
import { Result, Ok, Err, fromThrowable } from "@sass-store/core/src/result";
import {
  ErrorFactories,
  ValidationError,
} from "@sass-store/core/src/errors/types";

// Convert Zod error to ValidationError
export const zodErrorToValidationError = (
  zodError: ZodError,
  field?: string,
): ValidationError => {
  const errors = zodError.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }));

  return ErrorFactories.validation(
    `Validation failed: ${errors.map((e) => e.message).join(", ")}`,
    field,
    undefined,
    errors,
  );
};

// Validate with Zod schema
export const validateWithZod = <T>(
  schema: ZodSchema<T>,
  data: unknown,
  field?: string,
): Result<T, ValidationError> => {
  const result = fromThrowable(
    () => schema.parse(data),
    (error) => {
      if (error instanceof ZodError) {
        return zodErrorToValidationError(error, field);
      }
      return ErrorFactories.validation("Validation failed", field, data, error);
    },
  );

  return result;
};

// Safe parse with Result
export const safeParseWithZod = <T>(
  schema: ZodSchema<T>,
  data: unknown,
  field?: string,
): Result<T, ValidationError> => {
  const zodResult = schema.safeParse(data);

  if (zodResult.success) {
    return Ok(zodResult.data);
  } else {
    return Err(zodErrorToValidationError(zodResult.error, field));
  }
};

// Parse request body with Zod
export const parseRequestBody = async <T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<Result<T, ValidationError>> => {
  try {
    const body = await request.json();
    return validateWithZod(schema, body);
  } catch (error) {
    return Err(
      ErrorFactories.validation(
        "Failed to parse request body",
        undefined,
        undefined,
        error,
      ),
    );
  }
};

// Parse query parameters with Zod
export const parseQueryParams = (
  url: string,
  schema: ZodSchema<Record<string, any>>,
): Result<Record<string, any>, ValidationError> => {
  try {
    const { searchParams } = new URL(url);
    const params: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return validateWithZod(schema, params);
  } catch (error) {
    return Err(
      ErrorFactories.validation(
        "Failed to parse query parameters",
        undefined,
        undefined,
        error,
      ),
    );
  }
};

// Parse URL parameters with Zod
export const parsePathParams = (
  pathParams: Record<string, string>,
  schema: ZodSchema<Record<string, any>>,
): Result<Record<string, any>, ValidationError> => {
  return validateWithZod(schema, pathParams);
};

// Enhanced Zod schema with Result methods
export const resultSchema = <T>(zodSchema: ZodSchema<T>) => ({
  // Parse with Result
  parse: (data: unknown, field?: string) =>
    validateWithZod(zodSchema, data, field),

  // Safe parse with Result
  safeParse: (data: unknown, field?: string) =>
    safeParseWithZod(zodSchema, data, field),

  // Parse request body
  parseRequestBody: (request: Request) => parseRequestBody(request, zodSchema),

  // Parse query params
  parseQuery: (url: string) =>
    parseQueryParams(url, zodSchema as ZodSchema<Record<string, any>>),

  // Parse path params
  parsePath: (params: Record<string, string>) =>
    parsePathParams(params, zodSchema as ZodSchema<Record<string, any>>),

  // Get original Zod schema
  getSchema: () => zodSchema,
});

// Common validation schemas with Result integration
export const CommonSchemas = {
  // Email validation
  email: resultSchema(z.string().email()),

  // UUID validation
  uuid: resultSchema(z.string().uuid()),

  // Positive integer
  positiveInt: resultSchema(z.number().int().positive()),

  // Non-negative integer
  nonNegativeInt: resultSchema(z.number().int().nonnegative()),

  // String with length limits
  boundedString: (min: number, max: number) =>
    resultSchema(z.string().min(min).max(max)),

  // Optional string
  optionalString: (min?: number, max?: number) =>
    resultSchema(
      z
        .string()
        .min(min || 0)
        .max(max || 255)
        .optional(),
    ),

  // Date validation
  date: resultSchema(z.string().datetime()),

  // Pagination
  pagination: resultSchema(
    z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).optional(),
    }),
  ),

  // Sort options
  sort: (fields: string[]) => {
    const SortSchema = z.object({
      field: z.enum(fields as [string, ...string[]]),
      direction: z.enum(["asc", "desc"]).default("asc"),
    });
    return resultSchema(SortSchema);
  },
};

// Middleware helper for Next.js routes
export const withZodValidation = <T>(
  schema: ZodSchema<T>,
  handler: (request: Request, validatedData: T) => Promise<Response>,
) => {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    const validation = await parseRequestBody(request, schema);

    if (!validation.success) {
      return Response.json(
        {
          success: false,
          error: {
            message: validation.error.message,
            details: validation.error.details,
          },
        },
        { status: 400 },
      );
    }

    return handler(request, validation.data);
  };
};

// Type guard for validation errors
export const isValidationError = (error: any): error is ValidationError => {
  return error && typeof error === "object" && error.type === "ValidationError";
};

// Financial Matrix Schemas
export const MatrixGranularitySchema = z.enum([
  "week",
  "fortnight",
  "month",
  "year",
]);

export const MatrixLoadQuerySchema = z
  .object({
    tenantId: z.string().uuid(),
    granularity: MatrixGranularitySchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    entityId: z.string().uuid().optional(),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "startDate must be before or equal to endDate",
    path: ["endDate"],
  });

export const MatrixUpsertCellSchema = z
  .object({
    tenantId: z.string().uuid(),
    categoryId: z.string().uuid(),
    granularity: MatrixGranularitySchema,
    bucketId: z.string().min(1).optional(),
    bucketStartDate: z.coerce.date(),
    bucketEndDate: z.coerce.date(),
    projectedAmount: z.union([z.string(), z.number()]).transform((value) =>
      typeof value === "number" ? value.toFixed(2) : value,
    ),
    entityId: z.string().uuid().optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine((value) => value.bucketStartDate <= value.bucketEndDate, {
    message: "bucketStartDate must be before or equal to bucketEndDate",
    path: ["bucketEndDate"],
  });

export const MatrixMarkPaidSchema = z.object({
  tenantId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: z.union([z.string(), z.number()]).transform((value) =>
    typeof value === "number" ? value.toFixed(2) : value,
  ),
  fechaProgramada: z.coerce.date(),
  fechaPago: z.coerce.date().optional(),
  entityId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  paymentMethod: z.string().max(100).optional(),
  referenceId: z.string().max(200).optional(),
  counterparty: z.string().max(200).optional(),
});

export const MatrixCloneMonthSchema = z.object({
  tenantId: z.string().uuid(),
  sourceBucketId: z.string().regex(/^M\d{4}-\d{2}$/),
  targetBucketId: z.string().regex(/^M\d{4}-\d{2}$/),
  categoryIds: z.array(z.string().uuid()).optional(),
});
