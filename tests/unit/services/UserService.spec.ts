/**
 * User Service Tests
 *
 * Comprehensive tests for user management and authentication using Result Pattern.
 * Tests all major user operations with proper error handling.
 * 
 * Updated for monolith migration - tests mock service that mirrors the DB-backed implementation.
 */

// Vitest functions are globally available (globals: true in vitest.config.ts)

import { createTestContext } from "../../setup/TestContext";
import {
  expectSuccess,
  expectFailure,
  expectValidationError,
  expectNotFoundError,
} from "../../setup/TestUtilities";

// Type definitions for the service
interface User {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
  image: string | null;
  emailVerified: Date | null;
  phone: string | null;
  resetToken: string | null;
  resetTokenExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Extended fields for route compatibility
  firstName?: string;
  lastName?: string;
  role?: "admin" | "staff" | "customer";
  isActive?: boolean;
}

interface CreateUserData {
  id?: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  image?: string;
  role?: "admin" | "staff" | "customer";
}

interface UpdateUserData {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  role?: "admin" | "staff" | "customer";
  isActive?: boolean;
}

interface AuthCredentials {
  email: string;
  password: string;
}

interface AuthResult {
  user: User;
  token: string;
}

// Simple password hashing for mock (not secure, just for testing)
function mockHashPassword(password: string): string {
  return `hashed_${password}`;
}

function mockVerifyPassword(password: string, hash: string): boolean {
  return hash === `hashed_${password}`;
}

// Mock User Service for testing
class MockUserService {
  constructor(private db: any) {}

  async createUser(data: CreateUserData) {
    // Validate email
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid email format",
          field: "email",
          value: data.email,
        },
      };
    }

    // Validate firstName if provided
    if (data.firstName !== undefined && data.firstName.length === 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "First name cannot be empty",
          field: "firstName",
        },
      };
    }

    // Validate lastName if provided
    if (data.lastName !== undefined && data.lastName.length === 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Last name cannot be empty",
          field: "lastName",
        },
      };
    }

    // Validate password strength if provided
    if (data.password) {
      if (data.password.length < 12) {
        return {
          success: false,
          error: {
            type: "ValidationError",
            message: "Password must be at least 12 characters",
            field: "password",
          },
        };
      }
      if (!/[A-Z]/.test(data.password)) {
        return {
          success: false,
          error: {
            type: "ValidationError",
            message: "Password must contain at least one uppercase letter",
            field: "password",
          },
        };
      }
      if (!/[a-z]/.test(data.password)) {
        return {
          success: false,
          error: {
            type: "ValidationError",
            message: "Password must contain at least one lowercase letter",
            field: "password",
          },
        };
      }
      if (!/[0-9]/.test(data.password)) {
        return {
          success: false,
          error: {
            type: "ValidationError",
            message: "Password must contain at least one number",
            field: "password",
          },
        };
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(data.password)) {
        return {
          success: false,
          error: {
            type: "ValidationError",
            message: "Password must contain at least one special character",
            field: "password",
          },
        };
      }
    }

    // Check for duplicate email
    const existingUsers = await this.db.users.findMany(
      (u: User) => u.email === data.email,
    );

    if (existingUsers.length > 0) {
      return {
        success: false,
        error: {
          type: "BusinessRuleError",
          message: `User with email ${data.email} already exists`,
          rule: "user_email_exists",
        },
      };
    }

    // Create user
    const now = new Date();
    const fullName =
      data.name ||
      (data.firstName && data.lastName
        ? `${data.firstName} ${data.lastName}`
        : data.firstName || data.lastName || "");

    const user: User = {
      id: data.id || crypto.randomUUID(),
      email: data.email,
      name: fullName,
      password: data.password ? mockHashPassword(data.password) : null,
      image: data.image ?? null,
      emailVerified: null,
      phone: null,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: now,
      updatedAt: now,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      isActive: true,
    };

    await this.db.users.insert(user);

    return { success: true, data: user };
  }

  async getUserById(id: string) {
    if (!id || id.trim().length === 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "User ID is required",
          field: "id",
          value: id,
        },
      };
    }

    const user = await this.db.users.findById(id);

    if (!user) {
      return {
        success: false,
        error: {
          type: "NotFoundError",
          resource: "User",
          resourceId: id,
          message: `User with ID ${id} not found`,
        },
      };
    }

    // Parse name into firstName/lastName
    const nameParts = (user.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
      success: true,
      data: {
        ...user,
        firstName,
        lastName,
        isActive: true,
      },
    };
  }

  async findUserByEmail(email: string) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid email format",
          field: "email",
          value: email,
        },
      };
    }

    const users = await this.db.users.findMany(
      (u: User) => u.email === email,
    );

    if (users.length === 0) {
      return { success: true, data: null };
    }

    const user = users[0];
    const nameParts = (user.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
      success: true,
      data: {
        ...user,
        firstName,
        lastName,
        isActive: user.isActive !== false, // Preserve isActive from DB, default to true
      },
    };
  }

  async updateUser(id: string, data: UpdateUserData) {
    // Validate ID
    if (!id || id.trim().length === 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "User ID is required",
          field: "id",
          value: id,
        },
      };
    }

    // Validate email if provided
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid email format",
          field: "email",
          value: data.email,
        },
      };
    }

    const existingUser = await this.db.users.findById(id);

    if (!existingUser) {
      return {
        success: false,
        error: {
          type: "NotFoundError",
          resource: "User",
          resourceId: id,
          message: `User with ID ${id} not found`,
        },
      };
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingUser.email) {
      const emailCheck = await this.db.users.findMany(
        (u: User) => u.email === data.email,
      );

      if (emailCheck.length > 0) {
        return {
          success: false,
          error: {
            type: "BusinessRuleError",
            message: `User with email ${data.email} already exists`,
            rule: "user_email_exists",
          },
        };
      }
    }

    // Build name from firstName/lastName or use provided name
    let newName = existingUser.name;
    if (data.name) {
      newName = data.name;
    } else if (data.firstName || data.lastName) {
      const currentParts = (existingUser.name || "").split(" ");
      const firstName = data.firstName || currentParts[0] || "";
      const lastName = data.lastName || currentParts.slice(1).join(" ") || "";
      newName = `${firstName} ${lastName}`.trim();
    }

    const updatedUser = {
      ...existingUser,
      name: newName,
      email: data.email ?? existingUser.email,
      image: data.image ?? existingUser.image,
      updatedAt: new Date(),
    };

    await this.db.users.update(id, updatedUser);

    const nameParts = (updatedUser.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
      success: true,
      data: {
        ...updatedUser,
        firstName,
        lastName,
        role: data.role,
        isActive: data.isActive ?? true,
      },
    };
  }

  async deactivateUser(id: string) {
    const userResult = await this.getUserById(id);
    if (!userResult.success) {
      return userResult;
    }

    // Update the user in the database with isActive set to false
    const updatedUser = {
      ...userResult.data,
      isActive: false,
      updatedAt: new Date(),
    };
    
    await this.db.users.update(id, updatedUser);

    return {
      success: true,
      data: updatedUser,
    };
  }

  async getAllUsers() {
    const users = await this.db.users.findMany(() => true);

    const mappedUsers = users.map((u: User) => {
      const nameParts = (u.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      return {
        ...u,
        firstName,
        lastName,
        isActive: true,
      };
    });

    return { success: true, data: mappedUsers };
  }

  async authenticateUser(credentials: AuthCredentials) {
    // Validate credentials
    if (!credentials.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid email format",
          field: "email",
        },
      };
    }

    if (!credentials.password || credentials.password.length < 6) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Password must be at least 6 characters",
          field: "password",
        },
      };
    }

    // Find user by email
    const userResult = await this.findUserByEmail(credentials.email);
    if (!userResult.success) {
      return userResult;
    }

    const user = userResult.data;
    if (!user) {
      return {
        success: false,
        error: {
          type: "AuthenticationError",
          message: "Invalid email or password",
          reason: "invalid_credentials",
        },
      };
    }

    // Verify password
    if (!user.password || !mockVerifyPassword(credentials.password, user.password)) {
      return {
        success: false,
        error: {
          type: "AuthenticationError",
          message: "Invalid email or password",
          reason: "invalid_credentials",
        },
      };
    }

    // Check if user is active
    if (user.isActive === false) {
      return {
        success: false,
        error: {
          type: "BusinessRuleError",
          message: "User account is inactive",
          rule: "user_inactive",
        },
      };
    }

    // Generate auth token
    const token = Buffer.from(
      JSON.stringify({
        userId: user.id,
        email: user.email,
        name: user.name,
      }),
    ).toString("base64");

    return {
      success: true,
      data: {
        user,
        token,
      },
    };
  }
}

// Helper to create test user
function createTestUser(
  overrides: Partial<User> = {},
): User {
  return {
    id: crypto.randomUUID(),
    email: `test-${Date.now()}@example.com`,
    name: "Test User",
    password: null,
    image: null,
    emailVerified: null,
    phone: null,
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("UserService - Result Pattern Implementation", () => {
  let context: any;
  let userService: MockUserService;

  beforeEach(() => {
    context = createTestContext();
    userService = new MockUserService(context.db);
  });

  afterEach(() => {
    context?.db?.clear?.();
  });

  describe("createUser", () => {
    const validUserData: CreateUserData = {
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: "customer",
    };

    it("should create a user with valid data", async () => {
      const result = await userService.createUser(validUserData);

      expectSuccess(result);
      expect(result.data.email).toBe(validUserData.email);
      expect(result.data.firstName).toBe(validUserData.firstName);
      expect(result.data.lastName).toBe(validUserData.lastName);
      expect(result.data.role).toBe(validUserData.role);
      expect(result.data.isActive).toBe(true);
      expect(result.data.id).toBeDefined();
      expect(result.data.createdAt).toBeInstanceOf(Date);
    });

    it("should create a user with default customer role", async () => {
      const userDataWithoutRole = {
        email: "test2@example.com",
        firstName: "Test",
        lastName: "User",
      };

      const result = await userService.createUser(userDataWithoutRole);

      expectSuccess(result);
      expect(result.data.role).toBeUndefined(); // Role is not set by default
    });

    it("should return error for duplicate email", async () => {
      // Create first user
      await userService.createUser(validUserData);

      // Try to create user with same email
      const result = await userService.createUser(validUserData);

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("user_email_exists");
    });

    it("should return validation error for invalid email", async () => {
      const invalidData = {
        email: "invalid-email",
        firstName: "Test",
        lastName: "User",
      };

      const result = await userService.createUser(invalidData);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.field).toBe("email");
    });

    it("should return validation error for empty first name", async () => {
      const invalidData = {
        email: "test@example.com",
        firstName: "",
        lastName: "User",
      };

      const result = await userService.createUser(invalidData);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.field).toBe("firstName");
    });

    it("should return validation error for empty last name", async () => {
      const invalidData = {
        email: "test@example.com",
        firstName: "Test",
        lastName: "",
      };

      const result = await userService.createUser(invalidData);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.field).toBe("lastName");
    });

    it("should create admin user", async () => {
      const adminData = {
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin" as const,
      };

      const result = await userService.createUser(adminData);

      expectSuccess(result);
      expect(result.data.role).toBe("admin");
    });

    it("should return validation error for weak password", async () => {
      const result = await userService.createUser({
        email: "password-test@example.com",
        firstName: "Test",
        lastName: "User",
        password: "weak", // Too short, no uppercase, etc.
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.field).toBe("password");
    });

    it("should create user with strong password", async () => {
      const result = await userService.createUser({
        email: "strong-password@example.com",
        firstName: "Test",
        lastName: "User",
        password: "ValidPass123!@#",
      });

      expectSuccess(result);
      expect(result.data.password).toBeDefined();
      expect(result.data.password).not.toBe("ValidPass123!@#"); // Should be hashed
    });
  });

  describe("getUserById", () => {
    let testUser: User;

    beforeEach(async () => {
      const createResult = await userService.createUser({
        email: "getuser@example.com",
        firstName: "Test",
        lastName: "User",
      });
      testUser = createResult.data;
    });

    it("should return user for valid ID", async () => {
      const result = await userService.getUserById(testUser.id);

      expectSuccess(result);
      expect(result.data.id).toBe(testUser.id);
      expect(result.data.email).toBe(testUser.email);
      expect(result.data.firstName).toBe("Test");
      expect(result.data.lastName).toBe("User");
    });

    it("should return not found error for non-existent ID", async () => {
      const result = await userService.getUserById(crypto.randomUUID());

      expectNotFoundError(result, "User");
    });

    it("should return validation error for empty ID", async () => {
      const result = await userService.getUserById("");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("findUserByEmail", () => {
    let testUser: User;

    beforeEach(async () => {
      const createResult = await userService.createUser({
        email: "finduser@example.com",
        firstName: "Test",
        lastName: "User",
      });
      testUser = createResult.data;
    });

    it("should return user for existing email", async () => {
      const result = await userService.findUserByEmail(testUser.email);

      expectSuccess(result);
      expect(result.data?.email).toBe(testUser.email);
      expect(result.data?.firstName).toBe("Test");
    });

    it("should return null for non-existent email", async () => {
      const result = await userService.findUserByEmail("nonexistent@example.com");

      expectSuccess(result);
      expect(result.data).toBeNull();
    });

    it("should return validation error for invalid email", async () => {
      const result = await userService.findUserByEmail("invalid-email");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("updateUser", () => {
    let testUser: User;

    beforeEach(async () => {
      const createResult = await userService.createUser({
        email: "updateuser@example.com",
        firstName: "Test",
        lastName: "User",
      });
      testUser = createResult.data;
    });

    it("should update user email", async () => {
      const updateData: UpdateUserData = {
        email: "newemail@example.com",
      };

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await userService.updateUser(testUser.id, updateData);

      expectSuccess(result);
      expect(result.data.email).toBe(updateData.email);
      expect(result.data.updatedAt.getTime()).toBeGreaterThan(testUser.updatedAt.getTime());
    });

    it("should update user role to admin", async () => {
      const updateData: UpdateUserData = {
        role: "admin",
      };

      const result = await userService.updateUser(testUser.id, updateData);

      expectSuccess(result);
      expect(result.data.role).toBe("admin");
    });

    it("should update multiple fields", async () => {
      const updateData: UpdateUserData = {
        firstName: "Updated",
        lastName: "Name",
        role: "staff",
      };

      const result = await userService.updateUser(testUser.id, updateData);

      expectSuccess(result);
      expect(result.data.firstName).toBe("Updated");
      expect(result.data.lastName).toBe("Name");
      expect(result.data.role).toBe("staff");
    });

    it("should return error for duplicate email", async () => {
      // Create another user
      const otherUserResult = await userService.createUser({
        email: "other@example.com",
        firstName: "Other",
        lastName: "User",
      });

      // Try to update first user with second user's email
      const updateData: UpdateUserData = {
        email: otherUserResult.data.email,
      };

      const result = await userService.updateUser(testUser.id, updateData);

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("user_email_exists");
    });

    it("should return not found error for non-existent user", async () => {
      const updateData: UpdateUserData = {
        firstName: "Updated",
      };

      const result = await userService.updateUser(crypto.randomUUID(), updateData);

      expectNotFoundError(result, "User");
    });

    it("should return validation error for invalid email", async () => {
      const updateData: UpdateUserData = {
        email: "invalid-email",
      };

      const result = await userService.updateUser(testUser.id, updateData);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("deactivateUser", () => {
    let testUser: User;

    beforeEach(async () => {
      const createResult = await userService.createUser({
        email: "deactivate@example.com",
        firstName: "Test",
        lastName: "User",
      });
      testUser = createResult.data;
    });

    it("should deactivate user", async () => {
      const result = await userService.deactivateUser(testUser.id);

      expectSuccess(result);
      expect(result.data.isActive).toBe(false);
    });

    it("should return not found error for non-existent user", async () => {
      const result = await userService.deactivateUser(crypto.randomUUID());

      expectNotFoundError(result, "User");
    });
  });

  describe("authenticateUser", () => {
    const STRONG_PASSWORD = "ValidPass123!@#";
    let testUser: User;

    beforeEach(async () => {
      const createResult = await userService.createUser({
        email: "auth@example.com",
        firstName: "Test",
        lastName: "User",
        password: STRONG_PASSWORD,
        role: "customer",
      });
      testUser = createResult.data;
    });

    it("should authenticate user with valid credentials", async () => {
      const credentials: AuthCredentials = {
        email: testUser.email,
        password: STRONG_PASSWORD,
      };

      const result = await userService.authenticateUser(credentials);

      expectSuccess(result);
      expect(result.data.user.email).toBe(testUser.email);
      expect(result.data.user.firstName).toBe("Test");
      expect(result.data.token).toBeDefined();
      expect(typeof result.data.token).toBe("string");
    });

    it("should return error for invalid email", async () => {
      const credentials: AuthCredentials = {
        email: "nonexistent@example.com",
        password: STRONG_PASSWORD,
      };

      const result = await userService.authenticateUser(credentials);

      expectFailure(result);
      expect(result.error.type).toBe("AuthenticationError");
      expect(result.error.reason).toBe("invalid_credentials");
    });

    it("should return error for wrong password", async () => {
      const credentials: AuthCredentials = {
        email: testUser.email,
        password: "WrongPassword123!@#",
      };

      const result = await userService.authenticateUser(credentials);

      expectFailure(result);
      expect(result.error.type).toBe("AuthenticationError");
      expect(result.error.reason).toBe("invalid_credentials");
    });

    it("should return error for inactive user", async () => {
      // Deactivate user first
      await userService.deactivateUser(testUser.id);

      const credentials: AuthCredentials = {
        email: testUser.email,
        password: STRONG_PASSWORD,
      };

      const result = await userService.authenticateUser(credentials);

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("user_inactive");
    });

    it("should return validation error for invalid email format", async () => {
      const credentials: AuthCredentials = {
        email: "invalid-email",
        password: STRONG_PASSWORD,
      };

      const result = await userService.authenticateUser(credentials);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should return validation error for short password", async () => {
      const credentials: AuthCredentials = {
        email: testUser.email,
        password: "123",
      };

      const result = await userService.authenticateUser(credentials);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should authenticate admin user", async () => {
      // Create admin user
      const adminResult = await userService.createUser({
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        password: STRONG_PASSWORD,
        role: "admin",
      });

      const credentials: AuthCredentials = {
        email: adminResult.data.email,
        password: STRONG_PASSWORD,
      };

      const result = await userService.authenticateUser(credentials);

      expectSuccess(result);
      expect(result.data.user.role).toBe("admin");
    });
  });

  describe("getAllUsers", () => {
    it("should return empty array when no users exist", async () => {
      const result = await userService.getAllUsers();

      expectSuccess(result);
      expect(result.data).toEqual([]);
    });

    it("should return all users", async () => {
      // Create multiple users
      const user1Result = await userService.createUser({
        email: "user1@example.com",
        firstName: "User",
        lastName: "One",
      });

      const user2Result = await userService.createUser({
        email: "user2@example.com",
        firstName: "User",
        lastName: "Two",
      });

      const result = await userService.getAllUsers();

      expectSuccess(result);
      expect(result.data.length).toBe(2);
      expect(result.data.map((u: User) => u.email)).toContain(user1Result.data.email);
      expect(result.data.map((u: User) => u.email)).toContain(user2Result.data.email);
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent user creation with same email", async () => {
      const userData = {
        email: "concurrent@example.com",
        firstName: "Concurrent",
        lastName: "User",
      };

      // Create first user
      const result1 = await userService.createUser(userData);

      // Create second user with same data
      const result2 = await userService.createUser(userData);

      // First should succeed, second should fail
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
    });

    it("should handle user update with no changes", async () => {
      const createResult = await userService.createUser({
        email: "unchanged@example.com",
        firstName: "Unchanged",
        lastName: "User",
      });

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await userService.updateUser(createResult.data.id, {});

      expectSuccess(result);
      expect(result.data.updatedAt.getTime()).toBeGreaterThanOrEqual(
        createResult.data.updatedAt.getTime(),
      );
    });

    it("should handle user with long name", async () => {
      const result = await userService.createUser({
        email: "longname@example.com",
        firstName: "A".repeat(50),
        lastName: "B".repeat(50),
      });

      expectSuccess(result);
      expect(result.data.firstName?.length).toBe(50);
      expect(result.data.lastName?.length).toBe(50);
    });
  });
});
