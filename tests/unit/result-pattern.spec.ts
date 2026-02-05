/**
 * Tests for Result Pattern Implementation
 *
 * Tests the new Result pattern implementations
 * using the testing utilities from the core package.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  Result,
  Ok,
  Err,
  isSuccess,
  isFailure,
  map,
  flatMap,
  match,
  asyncFlatMap,
  fromPromise,
  fromCondition,
  pipe,
  expectSuccess,
  expectFailure,
} from "@sass-store/core/src/result";
import {
  ErrorFactories,
  DomainError,
  ErrorTypeGuards,
} from "@sass-store/core/src/errors/types";

describe("Result Pattern Implementation", () => {
  describe("Basic Result Operations", () => {
    it("should create success result", () => {
      const data = { id: "123", name: "test" };
      const result = Ok(data);

      expect(isSuccess(result)).toBe(true);
      expect(isFailure(result)).toBe(false);
      expect(result.data).toEqual(data);
    });

    it("should create error result", () => {
      const error = ErrorFactories.validation("Invalid input");
      const result = Err(error);

      expect(isSuccess(result)).toBe(false);
      expect(isFailure(result)).toBe(true);
      expect(result.error).toEqual(error);
    });
  });

  describe("Error Factories", () => {
    it("should create validation error", () => {
      const error = ErrorFactories.validation(
        "Invalid email",
        "email",
        "test@example.com",
      );

      expect(error.type).toBe("ValidationError");
      expect(error.message).toBe("Invalid email");
      expect(error.field).toBe("email");
      expect(error.details).toBe("test@example.com");
    });

    it("should create not found error", () => {
      const error = ErrorFactories.notFound("User", "user-123");

      expect(error.type).toBe("NotFoundError");
      expect(error.resource).toBe("User");
      expect(error.resourceId).toBe("user-123");
    });

    it("should create authorization error", () => {
      const error = ErrorFactories.authorization(
        "Access denied",
        "admin_access",
        "user-123",
      );

      expect(error.type).toBe("AuthorizationError");
      expect(error.required).toBe("admin_access");
      expect(error.userId).toBe("user-123");
    });

    it("should create database error", () => {
      const dbError = new Error("Connection failed");
      const error = ErrorFactories.database(
        "connection",
        "Database connection failed",
        "SELECT * FROM users",
        dbError,
      );

      expect(error.type).toBe("DatabaseError");
      expect(error.operation).toBe("connection");
      expect(error.cause).toBe(dbError);
    });
  });

  describe("Error Type Guards", () => {
    it("should identify validation errors", () => {
      const error = ErrorFactories.validation("Invalid input");
      expect(ErrorTypeGuards.isValidationError(error)).toBe(true);
      expect(ErrorTypeGuards.isNotFoundError(error)).toBe(false);
    });

    it("should identify not found errors", () => {
      const error = ErrorFactories.notFound("User", "123");
      expect(ErrorTypeGuards.isNotFoundError(error)).toBe(true);
      expect(ErrorTypeGuards.isValidationError(error)).toBe(false);
    });
  });

  describe("Result Combinators", () => {
    it("should chain successful operations", () => {
      const result1 = Ok("hello");
      const result2 = map(result1, (value) => value.toUpperCase());
      const result3 = map(result2, (value) => `${value}!`);
      const result4 = map(result3, (value) => value.toLowerCase());

      expect(isSuccess(result4)).toBe(true);
      if (isSuccess(result4)) {
        expect(result4.data).toEqual("HELLO!");
      }
    });

    it("should short-circuit on first error", () => {
      const result1 = Ok("hello");
      const result2 = map(result1, (value) => value.toUpperCase());
      const result3 = flatMap(result2, () =>
        Err(ErrorFactories.validation("Failed")),
      );
      const result4 = map(result3, (value) => value.toLowerCase()); // This should not execute

      expect(isFailure(result4)).toBe(true);
      if (isFailure(result4)) {
        expect(result4.error).toEqual(
          expect.objectContaining({
            type: "ValidationError",
            message: "Failed",
          }),
        );
      }
    });
  });

  describe("Pattern Matching", () => {
    it("should match success case", () => {
      const result = Ok("success data");
      const outcome = result.match({
        ok: (data) => `Success: ${data}`,
        err: (error) => `Error: ${error.message}`,
      });

      expect(outcome).toBe("Success: success data");
    });

    it("should match error case", () => {
      const error = ErrorFactories.notFound("Resource", "123");
      const result = Err(error);
      const outcome = result.match({
        ok: (data) => `Success: ${data}`,
        err: (error) => `Error: ${error.message} (${error.type})`,
      });

      expect(outcome).toBe(
        "Error: Resource with ID 123 not found (NotFoundError)",
      );
    });
  });

  describe("Async Operations", () => {
    it("should handle successful async operations", async () => {
      const asyncOperation = async () => "async result";
      const result = await Promise.resolve("input")
        .then((value) => Ok(value))
        .then((result) => result.map((data) => data.toUpperCase()));

      expectSuccess(result).toEqual("ASYNC RESULT");
    });

    it("should handle async failures", async () => {
      const asyncOperation = async () => {
        throw new Error("Async failure");
      };

      const result = await fromPromise(asyncOperation());

      expectFailure(result).toEqual(
        expect.objectContaining({
          type: "DatabaseError",
          message: "Async failure",
        }),
      );
    });
  });

  describe("Complex Business Logic", () => {
    it("should validate user registration flow", async () => {
      // Simulate user registration validation
      const validateEmail = (email: string): Result<string, DomainError> => {
        if (!email.includes("@")) {
          return Err(
            ErrorFactories.validation("Invalid email format", "email", email),
          );
        }
        return Ok(email.toLowerCase());
      };

      const validatePassword = (
        password: string,
      ): Result<string, DomainError> => {
        if (password.length < 8) {
          return Err(
            ErrorFactories.validation("Password too short", "password"),
          );
        }
        return Ok(password);
      };

      const checkDuplicateEmail = async (
        email: string,
      ): Promise<Result<boolean, DomainError>> => {
        // Simulate database check
        return Ok(email !== "existing@example.com");
      };

      // Chain validations
      const emailValidation = validateEmail("USER@EXAMPLE.COM");
      const passwordValidation = validatePassword("password123");
      const duplicateCheck = await checkDuplicateEmail("user@example.com");

      const finalResult = emailValidation.success
        ? passwordValidation.success
          ? (await duplicateCheck)
            ? Ok({
                email: emailValidation.data,
                password: passwordValidation.data,
              })
            : duplicateCheck
          : passwordValidation
        : emailValidation;

      // Success case
      if (finalResult.success) {
        expectSuccess(finalResult).toEqual({
          email: "user@example.com",
          password: "password123",
        });
      } else {
        // Should fail at email validation
        expectFailure(finalResult).toEqual(
          expect.objectContaining({
            type: "ValidationError",
            field: "email",
          }),
        );
      }
    });
  });

  describe("Error Recovery Strategies", () => {
    it("should provide fallback values", () => {
      const successResult = Ok("primary value");
      const errorResult = Err(ErrorFactories.notFound("Resource", "123"));

      expect(successResult.getOrElse("fallback")).toBe("primary value");
      expect(errorResult.getOrElse("fallback")).toBe("fallback");
      expect(errorResult.getOrElse(() => "computed fallback")).toBe(
        "computed fallback",
      );
    });

    it("should transform errors", () => {
      const error = ErrorFactories.validation("Input error", "field");
      const transformedError = error
        .mapError((err) =>
          ErrorFactories.authorization(`Access denied: ${err.message}`),
        )
        .mapError((err) => ErrorFactories.database(`DB error: ${err.message}`));

      expectFailure(transformedError).toEqual(
        expect.objectContaining({
          type: "DatabaseError",
          message: "DB error: Access denied: Input error",
        }),
      );
    });
  });

  describe("Result Caching", () => {
    it("should cache successful results", async () => {
      const cache = new Map<string, any>();
      const cacheKey = "test-key";
      const cacheTTL = 1000; // 1 second

      const expensiveOperation = async (): Promise<
        Result<string, DomainError>
      > => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return Ok("cached result");
      };

      // Cache implementation
      const getCached = async (
        key: string,
      ): Promise<Result<string, DomainError>> => {
        const cached = cache.get(key);
        const now = Date.now();

        if (cached && now - cached.timestamp < cacheTTL) {
          return Ok(cached.value);
        }

        const result = await expensiveOperation();
        cache.set(key, { value: result.data, timestamp: now });
        return result;
      };

      // First call - should cache
      const result1 = await getCached(cacheKey);
      expectSuccess(result1).toBe("cached result");

      // Second call - should return cached value
      const result2 = await getCached(cacheKey);
      expectSuccess(result2).toBe("cached result");

      // Verify cache state
      expect(cache.has(cacheKey)).toBe(true);
    });
  });
});
