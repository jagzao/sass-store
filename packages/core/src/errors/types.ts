/**
 * Domain Error Types
 *
 * Defines specific error types for different parts of the business domain.
 * This replaces generic Error objects with typed, structured errors.
 */

// Base domain error interface
export interface BaseDomainError {
  readonly type: string;
  readonly message: string;
  readonly details?: any;
  readonly cause?: Error;
  readonly timestamp: Date;
  readonly context?: Record<string, any>;
}

// Validation Errors
export interface ValidationError extends BaseDomainError {
  readonly type: "ValidationError";
  readonly field?: string;
  readonly value?: any;
}

// Resource Not Found Errors
export interface NotFoundError extends BaseDomainError {
  readonly type: "NotFoundError";
  readonly resource: string;
  readonly resourceId?: string;
}

// Authorization Errors
export interface AuthorizationError extends BaseDomainError {
  readonly type: "AuthorizationError";
  readonly required?: string;
  readonly userId?: string;
}

// Authentication Errors
export interface AuthenticationError extends BaseDomainError {
  readonly type: "AuthenticationError";
  readonly reason:
    | "invalid_credentials"
    | "expired"
    | "missing_token"
    | "invalid_token";
}

// Business Rule Violations
export interface BusinessRuleError extends BaseDomainError {
  readonly type: "BusinessRuleError";
  readonly rule: string;
  readonly code?: string;
}

// Database/Infrastructure Errors
export interface DatabaseError extends BaseDomainError {
  readonly type: "DatabaseError";
  readonly operation: string;
  readonly query?: string;
}

// Network/API Errors
export interface NetworkError extends BaseDomainError {
  readonly type: "NetworkError";
  readonly endpoint?: string;
  readonly statusCode?: number;
}

// Configuration Errors
export interface ConfigurationError extends BaseDomainError {
  readonly type: "ConfigurationError";
  readonly setting: string;
  readonly expectedType?: string;
}

// Rate Limiting Errors
export interface RateLimitError extends BaseDomainError {
  readonly type: "RateLimitError";
  readonly limit: number;
  readonly window: string;
  readonly retryAfter?: number;
}

// Payment/Processing Errors
export interface PaymentError extends BaseDomainError {
  readonly type: "PaymentError";
  readonly paymentId?: string;
  readonly provider?: string;
  readonly code?: string;
}

// Tenant/Multi-tenancy Errors
export interface TenantError extends BaseDomainError {
  readonly type: "TenantError";
  readonly tenantId?: string;
  readonly operation: string;
}

// File/Storage Errors
export interface StorageError extends BaseDomainError {
  readonly type: "StorageError";
  readonly operation: string;
  readonly path?: string;
  readonly provider?: string;
}

// Union type for all domain errors
export type DomainError =
  | ValidationError
  | NotFoundError
  | AuthorizationError
  | AuthenticationError
  | BusinessRuleError
  | DatabaseError
  | NetworkError
  | ConfigurationError
  | RateLimitError
  | PaymentError
  | TenantError
  | StorageError;

// Error factories for convenient creation
export const ErrorFactories = {
  // Validation
  validation: (
    message: string,
    field?: string,
    value?: any,
    details?: any,
  ): ValidationError => ({
    type: "ValidationError",
    message,
    field,
    value,
    details,
    timestamp: new Date(),
  }),

  // Not Found
  notFound: (
    resource: string,
    resourceId?: string,
    details?: any,
  ): NotFoundError => ({
    type: "NotFoundError",
    message: `${resource}${resourceId ? ` with ID ${resourceId}` : ""} not found`,
    resource,
    resourceId,
    details,
    timestamp: new Date(),
  }),

  // Authorization
  authorization: (
    message: string,
    required?: string,
    userId?: string,
  ): AuthorizationError => ({
    type: "AuthorizationError",
    message,
    required,
    userId,
    timestamp: new Date(),
  }),

  // Authentication
  authentication: (
    reason: AuthenticationError["reason"],
    message?: string,
  ): AuthenticationError => ({
    type: "AuthenticationError",
    reason,
    message: message || `Authentication failed: ${reason}`,
    timestamp: new Date(),
  }),

  // Business Rule
  businessRule: (
    rule: string,
    message: string,
    code?: string,
  ): BusinessRuleError => ({
    type: "BusinessRuleError",
    rule,
    message,
    code,
    timestamp: new Date(),
  }),

  // Database
  database: (
    operation: string,
    message: string,
    query?: string,
    cause?: Error,
  ): DatabaseError => ({
    type: "DatabaseError",
    message: `Database error during ${operation}: ${message}`,
    operation,
    query,
    cause,
    timestamp: new Date(),
  }),

  // Network
  network: (
    message: string,
    endpoint?: string,
    statusCode?: number,
    cause?: Error,
  ): NetworkError => ({
    type: "NetworkError",
    message,
    endpoint,
    statusCode,
    cause,
    timestamp: new Date(),
  }),

  // Configuration
  configuration: (
    setting: string,
    message: string,
    expectedType?: string,
  ): ConfigurationError => ({
    type: "ConfigurationError",
    message: `Configuration error for ${setting}: ${message}`,
    setting,
    expectedType,
    timestamp: new Date(),
  }),

  // Rate Limit
  rateLimit: (
    limit: number,
    window: string,
    retryAfter?: number,
  ): RateLimitError => ({
    type: "RateLimitError",
    message: `Rate limit exceeded: ${limit} requests per ${window}`,
    limit,
    window,
    retryAfter,
    timestamp: new Date(),
  }),

  // Payment
  payment: (
    message: string,
    paymentId?: string,
    provider?: string,
    code?: string,
  ): PaymentError => ({
    type: "PaymentError",
    message,
    paymentId,
    provider,
    code,
    timestamp: new Date(),
  }),

  // Tenant
  tenant: (
    operation: string,
    message: string,
    tenantId?: string,
  ): TenantError => ({
    type: "TenantError",
    message: `Tenant error during ${operation}: ${message}`,
    operation,
    tenantId,
    timestamp: new Date(),
  }),

  // Storage
  storage: (
    operation: string,
    message: string,
    path?: string,
    provider?: string,
    cause?: Error,
  ): StorageError => ({
    type: "StorageError",
    message: `Storage error during ${operation}: ${message}`,
    operation,
    path,
    provider,
    cause,
    timestamp: new Date(),
  }),
};

// Type guards for error types
export const ErrorTypeGuards = {
  isValidationError: (error: DomainError): error is ValidationError =>
    error.type === "ValidationError",
  isNotFoundError: (error: DomainError): error is NotFoundError =>
    error.type === "NotFoundError",
  isAuthorizationError: (error: DomainError): error is AuthorizationError =>
    error.type === "AuthorizationError",
  isAuthenticationError: (error: DomainError): error is AuthenticationError =>
    error.type === "AuthenticationError",
  isBusinessRuleError: (error: DomainError): error is BusinessRuleError =>
    error.type === "BusinessRuleError",
  isDatabaseError: (error: DomainError): error is DatabaseError =>
    error.type === "DatabaseError",
  isNetworkError: (error: DomainError): error is NetworkError =>
    error.type === "NetworkError",
  isConfigurationError: (error: DomainError): error is ConfigurationError =>
    error.type === "ConfigurationError",
  isRateLimitError: (error: DomainError): error is RateLimitError =>
    error.type === "RateLimitError",
  isPaymentError: (error: DomainError): error is PaymentError =>
    error.type === "PaymentError",
  isTenantError: (error: DomainError): error is TenantError =>
    error.type === "TenantError",
  isStorageError: (error: DomainError): error is StorageError =>
    error.type === "StorageError",
};

// Convert standard Error to DomainError
export const toDomainError = (
  error: unknown,
  defaultMessage: string = "Unknown error",
): DomainError => {
  if (error && typeof error === "object" && "type" in error) {
    return error as DomainError;
  }

  if (error instanceof Error) {
    return ErrorFactories.database(
      "unknown",
      error.message || defaultMessage,
      undefined,
      error,
    );
  }

  return ErrorFactories.validation(defaultMessage);
};

// HTTP Status Code mapping
export const getHttpStatusCode = (error: DomainError): number => {
  switch (error.type) {
    case "ValidationError":
      return 400;
    case "NotFoundError":
      return 404;
    case "AuthenticationError":
      return 401;
    case "AuthorizationError":
      return 403;
    case "BusinessRuleError":
      return 422;
    case "RateLimitError":
      return 429;
    case "ConfigurationError":
    case "DatabaseError":
    case "StorageError":
    case "NetworkError":
      return 500;
    case "PaymentError":
      return 402;
    case "TenantError":
      return 403;
    default:
      return 500;
  }
};
