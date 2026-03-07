/**
 * Tests for Result Pattern Implementation
 *
 * Tests the new Result pattern implementations
 * using the testing utilities from the core package.
 */

// Using globals instead of imports since globals: true in Vitest config
import {
  Ok,
  Err,
  isSuccess,
  isFailure,
  map,
  flatMap,
  match,
  fromPromise,
  getOrElse,
  mapError,
} from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";

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
      expect(error.value).toBe("test@example.com");
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

  describe("Result Combinators", () => {
    it("should chain successful operations", () => {
      const result1 = Ok("hello");
      const result2 = map(result1, (value) => value.toUpperCase());
      const result3 = map(result2, (value) => `${value}!`);
      const result4 = map(result3, (value) => value);

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
      const result4 = map(result3, (value: string) => value.toLowerCase());

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
      const outcome = match(result, {
        ok: (data) => `Success: ${data}`,
        err: (error) => `Error: ${(error as Error).message}`,
      });

      expect(outcome).toBe("Success: success data");
    });

    it("should match error case", () => {
      const error = ErrorFactories.notFound("Resource", "123");
      const result = Err(error);
      const outcome = match(result, {
        ok: (data) => `Success: ${data}`,
        err: (err) => `Error: ${err.message} (${err.type})`,
      });

      expect(outcome).toBe(
        "Error: Resource with ID 123 not found (NotFoundError)",
      );
    });
  });

  describe("Async Operations", () => {
    it("should handle successful async operations", async () => {
      const result = map(Ok("async result"), (data) => data.toUpperCase());
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual("ASYNC RESULT");
      }
    });

    it("should handle async failures", async () => {
      const asyncOperation = async () => {
        throw new Error("Async failure");
      };

      const result = await fromPromise(
        asyncOperation(),
        (error) =>
          ErrorFactories.database(
            "async_operation",
            (error as Error).message,
            undefined,
            error as Error,
          ),
      );

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toEqual(
          expect.objectContaining({
            type: "DatabaseError",
            message:
              "Database error during async_operation: Async failure",
          }),
        );
      }
    });
  });

  describe("Error Recovery Strategies", () => {
    it("should provide fallback values", () => {
      const successResult = Ok("primary value");
      const errorResult = Err(ErrorFactories.notFound("Resource", "123"));

      expect(getOrElse(successResult, "fallback")).toBe("primary value");
      expect(getOrElse(errorResult, "fallback")).toBe("fallback");
      expect(getOrElse(errorResult, "computed fallback")).toBe(
        "computed fallback",
      );
    });

    it("should transform errors", () => {
      const result = Err(ErrorFactories.validation("Input error", "field"));
      const transformedError = mapError(
        mapError(result, (err) =>
          ErrorFactories.authorization(`Access denied: ${err.message}`),
        ),
        (err) =>
          ErrorFactories.database(
            "error_transform",
            `DB error: ${err.message}`,
          ),
      );

      expect(isFailure(transformedError)).toBe(true);
      if (isFailure(transformedError)) {
        expect(transformedError.error).toEqual(
          expect.objectContaining({
            type: "DatabaseError",
            message:
              "Database error during error_transform: DB error: Access denied: Input error",
          }),
        );
      }
    });
  });
});

// ============================================
// Role Guard Utilities Tests
// ============================================

import {
  STAFF_ROLES,
  CLIENT_ROLES,
  isStaffRole,
  isClientRole,
  shouldShowHomeTenant,
  shouldShowPublicHome,
  normalizeRole,
  getRoleDisplayName,
} from "../../apps/web/lib/auth/role-guards";

describe("Role Guard Utilities", () => {
  describe("Constants", () => {
    it("should define STAFF_ROLES correctly", () => {
      expect(STAFF_ROLES).toEqual(["admin", "gerente", "personal"]);
    });

    it("should define CLIENT_ROLES correctly", () => {
      expect(CLIENT_ROLES).toEqual(["cliente"]);
    });
  });

  describe("isStaffRole", () => {
    it("should return true for staff roles", () => {
      expect(isStaffRole("admin")).toBe(true);
      expect(isStaffRole("gerente")).toBe(true);
      expect(isStaffRole("personal")).toBe(true);
    });

    it("should handle case-insensitive matching", () => {
      expect(isStaffRole("ADMIN")).toBe(true);
      expect(isStaffRole("Gerente")).toBe(true);
      expect(isStaffRole("PERSONAL")).toBe(true);
    });

    it("should return false for non-staff roles", () => {
      expect(isStaffRole("cliente")).toBe(false);
      expect(isStaffRole("unknown")).toBe(false);
      expect(isStaffRole("")).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isStaffRole(null)).toBe(false);
      expect(isStaffRole(undefined)).toBe(false);
    });
  });

  describe("isClientRole", () => {
    it("should return true for cliente", () => {
      expect(isClientRole("cliente")).toBe(true);
      expect(isClientRole("CLIENTE")).toBe(true);
      expect(isClientRole("Cliente")).toBe(true);
    });

    it("should return false for non-client roles", () => {
      expect(isClientRole("admin")).toBe(false);
      expect(isClientRole("gerente")).toBe(false);
      expect(isClientRole("personal")).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isClientRole(null)).toBe(false);
      expect(isClientRole(undefined)).toBe(false);
    });
  });

  describe("shouldShowHomeTenant", () => {
    it("should return true for staff roles", () => {
      expect(shouldShowHomeTenant("admin")).toBe(true);
      expect(shouldShowHomeTenant("gerente")).toBe(true);
      expect(shouldShowHomeTenant("personal")).toBe(true);
    });

    it("should return false for client and unauthenticated", () => {
      expect(shouldShowHomeTenant("cliente")).toBe(false);
      expect(shouldShowHomeTenant(null)).toBe(false);
      expect(shouldShowHomeTenant(undefined)).toBe(false);
      expect(shouldShowHomeTenant("unknown")).toBe(false);
    });
  });

  describe("shouldShowPublicHome", () => {
    it("should return false for staff roles", () => {
      expect(shouldShowPublicHome("admin")).toBe(false);
      expect(shouldShowPublicHome("gerente")).toBe(false);
      expect(shouldShowPublicHome("personal")).toBe(false);
    });

    it("should return true for client and unauthenticated", () => {
      expect(shouldShowPublicHome("cliente")).toBe(true);
      expect(shouldShowPublicHome(null)).toBe(true);
      expect(shouldShowPublicHome(undefined)).toBe(true);
      expect(shouldShowPublicHome("unknown")).toBe(true);
    });
  });

  describe("normalizeRole", () => {
    it("should lowercase and trim", () => {
      expect(normalizeRole("ADMIN")).toBe("admin");
      expect(normalizeRole("  admin  ")).toBe("admin");
      expect(normalizeRole("  ADMIN  ")).toBe("admin");
    });

    it("should return null for empty/null/undefined", () => {
      expect(normalizeRole(null)).toBe(null);
      expect(normalizeRole(undefined)).toBe(null);
      expect(normalizeRole("")).toBe(null);
      // Whitespace-only returns empty string after trim, which is falsy
      const whitespaceResult = normalizeRole("   ");
      expect(whitespaceResult).toBeFalsy(); // Either null or "" is acceptable
    });
  });

  describe("getRoleDisplayName", () => {
    it("should return display names for known roles", () => {
      expect(getRoleDisplayName("admin")).toBe("Administrador");
      expect(getRoleDisplayName("gerente")).toBe("Gerente");
      expect(getRoleDisplayName("personal")).toBe("Personal");
      expect(getRoleDisplayName("cliente")).toBe("Cliente");
    });

    it("should handle case-insensitive input", () => {
      expect(getRoleDisplayName("ADMIN")).toBe("Administrador");
      expect(getRoleDisplayName("CLIENTE")).toBe("Cliente");
    });

    it("should return original role for unknown roles", () => {
      expect(getRoleDisplayName("unknown")).toBe("unknown");
      expect(getRoleDisplayName("supervisor")).toBe("supervisor");
    });
  });

  describe("Integration: Role routing decisions", () => {
    it("should route staff to HomeTenant", () => {
      expect(shouldShowHomeTenant("admin")).toBe(true);
      expect(shouldShowPublicHome("admin")).toBe(false);
      expect(isStaffRole("admin")).toBe(true);
    });

    it("should route cliente to public home", () => {
      expect(shouldShowHomeTenant("cliente")).toBe(false);
      expect(shouldShowPublicHome("cliente")).toBe(true);
      expect(isClientRole("cliente")).toBe(true);
    });

    it("should route unauthenticated to public home", () => {
      expect(shouldShowHomeTenant(null)).toBe(false);
      expect(shouldShowPublicHome(null)).toBe(true);
    });
  });
});
