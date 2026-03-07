import { Result, Ok, Err, isFailure } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db, users, userRoles, tenants, eq, and, sql } from "@sass-store/database";
import type { InferSelectModel } from "drizzle-orm";

// Strong password schema for registration (12+ chars, uppercase, lowercase, number, symbol)
export const StrongPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    "Password must contain at least one special character",
  );

// Helper to validate password strength
export const validatePasswordStrength = (
  password: string,
): Result<void, DomainError> => {
  const result = StrongPasswordSchema.safeParse(password);
  if (!result.success) {
    const messages = result.error.errors.map((e) => e.message).join("; ");
    return Err(
      ErrorFactories.validation("weak_password", messages, "password"),
    );
  }
  return Ok(undefined);
};

// Types
export type User = InferSelectModel<typeof users> & {
  // Extended fields for route compatibility
  firstName?: string;
  lastName?: string;
  role?: "admin" | "staff" | "customer";
  isActive?: boolean;
};

export interface CreateUserData {
  id?: string; // Optional, will generate if not provided
  email: string;
  name?: string; // Full name
  firstName?: string; // For route compatibility
  lastName?: string; // For route compatibility
  password?: string;
  image?: string;
  role?: "admin" | "staff" | "customer";
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  role?: "admin" | "staff" | "customer";
  isActive?: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

// Zod Schemas
const CreateUserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  password: z.string().min(6).optional(),
  image: z.string().url().optional(),
  role: z.enum(["admin", "staff", "customer"]).optional(),
});

const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(100).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  image: z.string().url().optional(),
  role: z.enum(["admin", "staff", "customer"]).optional(),
  isActive: z.boolean().optional(),
});

const AuthCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class UserService {
  // Create a new user (for registration - requires strong password)
  async createUser(data: CreateUserData): Promise<Result<User, DomainError>> {
    // Validate input data
    const validationResult = validateWithZod(CreateUserSchema, data);
    if (isFailure(validationResult)) {
      return validationResult;
    }

    // Validate password strength if password is provided
    if (data.password) {
      const passwordValidation = validatePasswordStrength(data.password);
      if (isFailure(passwordValidation)) {
        return passwordValidation;
      }
    }

    // Check if user already exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUsers.length > 0) {
      return Err(
        ErrorFactories.businessRule(
          "user_email_exists",
          `User with email ${data.email} already exists`,
          "EMAIL_EXISTS",
        ),
      );
    }

    // Create new user
    const now = new Date();
    const passwordHash = data.password
      ? await bcrypt.hash(data.password, 10)
      : null;

    // Build name from firstName/lastName or use provided name
    const fullName =
      data.name ||
      (data.firstName && data.lastName
        ? `${data.firstName} ${data.lastName}`
        : data.firstName || data.lastName || "");

    const userId = data.id || crypto.randomUUID();
    const insertData = {
      id: userId,
      email: data.email,
      name: fullName,
      password: passwordHash,
      image: data.image ?? null,
      emailVerified: null,
      phone: null,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.insert(users).values(insertData).returning();

    if (!result[0]) {
      return Err(
        ErrorFactories.database(
          "create_user",
          `Failed to create user with email ${data.email}`,
          undefined,
          new Error("No result returned from insert"),
        ),
      );
    }

    // Return with extended fields for compatibility
    const user: User = {
      ...result[0],
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      isActive: true,
    };

    return Ok(user);
  }

  // Get user by ID
  async getUserById(id: string): Promise<Result<User, DomainError>> {
    if (!id || id.trim().length === 0) {
      return Err(
        ErrorFactories.validation(
          "invalid_user_id",
          "User ID is required",
          "id",
          id,
        ),
      );
    }

    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (result.length === 0) {
      return Err(
        ErrorFactories.notFound("User", id, `User with ID ${id} not found`),
      );
    }

    // Parse name into firstName/lastName for compatibility
    const nameParts = (result[0].name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const user: User = {
      ...result[0],
      firstName,
      lastName,
      isActive: true,
    };

    return Ok(user);
  }

  // Find user by email (returns Ok(null) if not found)
  async findUserByEmail(
    email: string,
  ): Promise<Result<User | null, DomainError>> {
    const emailValidation = CommonSchemas.email.parse(email);
    if (isFailure(emailValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_email",
          "Invalid email format",
          "email",
          email,
        ),
      );
    }

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) {
      return Ok(null);
    }

    // Parse name into firstName/lastName for compatibility
    const nameParts = (result[0].name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const user: User = {
      ...result[0],
      firstName,
      lastName,
      isActive: true,
    };

    return Ok(user);
  }

  // Update user
  async updateUser(
    id: string,
    data: UpdateUserData,
  ): Promise<Result<User, DomainError>> {
    // Validate ID
    if (!id || id.trim().length === 0) {
      return Err(
        ErrorFactories.validation(
          "invalid_user_id",
          "User ID is required",
          "id",
          id,
        ),
      );
    }

    // Validate update data
    const validationResult = validateWithZod(UpdateUserSchema, data);
    if (isFailure(validationResult)) {
      return validationResult;
    }

    // Check if user exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (existingUsers.length === 0) {
      return Err(
        ErrorFactories.notFound("User", id, `User with ID ${id} not found`),
      );
    }

    const existingUser = existingUsers[0];

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingUser.email) {
      const emailCheck = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (emailCheck.length > 0) {
        return Err(
          ErrorFactories.businessRule(
            "user_email_exists",
            `User with email ${data.email} already exists`,
            "EMAIL_EXISTS",
          ),
        );
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

    const updateData: Record<string, unknown> = {
      name: newName,
      updatedAt: new Date(),
    };

    if (data.email) {
      updateData.email = data.email;
    }

    if (data.image) {
      updateData.image = data.image;
    }

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!result[0]) {
      return Err(
        ErrorFactories.database(
          "update_user",
          `Failed to update user with ID ${id}`,
          undefined,
          new Error("No result returned from update"),
        ),
      );
    }

    // Parse name into firstName/lastName for compatibility
    const nameParts = (result[0].name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const user: User = {
      ...result[0],
      firstName,
      lastName,
      role: data.role,
      isActive: data.isActive ?? true,
    };

    return Ok(user);
  }

  // Deactivate user (soft delete)
  async deactivateUser(id: string): Promise<Result<User, DomainError>> {
    // For now, we don't have an isActive field in the schema
    // So we'll just return success with the user data
    const userResult = await this.getUserById(id);
    if (isFailure(userResult)) {
      return userResult;
    }

    // In a real implementation, we would update an isActive field
    // For now, we just return the user with isActive set to false
    const user: User = {
      ...userResult.data,
      isActive: false,
    };

    return Ok(user);
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<Result<User[], DomainError>> {
    const results = await db.select().from(users).orderBy(users.createdAt);

    // Map to include extended fields
    const mappedUsers: User[] = results.map((u) => {
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

    return Ok(mappedUsers);
  }

  // Authenticate user
  async authenticateUser(
    credentials: AuthCredentials,
  ): Promise<Result<AuthResult, DomainError>> {
    // Validate credentials
    const validationResult = validateWithZod(
      AuthCredentialsSchema,
      credentials,
    );
    if (isFailure(validationResult)) {
      return validationResult;
    }

    // Find user by email
    const userResult = await this.findUserByEmail(credentials.email);
    if (isFailure(userResult)) {
      return userResult;
    }

    const user = userResult.data;
    if (!user) {
      return Err(
        ErrorFactories.authentication(
          "invalid_credentials",
          "Invalid email or password",
        ),
      );
    }

    // Verify the password using bcrypt
    const isPasswordValid = await this.verifyPassword(
      credentials.password,
      user,
    );

    if (!isPasswordValid) {
      return Err(
        ErrorFactories.authentication(
          "invalid_credentials",
          "Invalid email or password",
        ),
      );
    }

    // Generate auth token (in real implementation, use JWT)
    const token = this.generateAuthToken(user);

    const authResult: AuthResult = {
      user,
      token,
    };

    return Ok(authResult);
  }

  // Get user roles for a tenant
  async getUserRoles(
    userId: string,
    tenantId: string,
  ): Promise<Result<Array<{ role: string; tenantId: string }>, DomainError>> {
    if (!userId || userId.trim().length === 0) {
      return Err(
        ErrorFactories.validation(
          "invalid_user_id",
          "User ID is required",
          "userId",
          userId,
        ),
      );
    }

    const uuidValidation = CommonSchemas.uuid.parse(tenantId);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_tenant_id",
          "Invalid tenant ID format",
          "tenantId",
          tenantId,
        ),
      );
    }

    const result = await db
      .select({
        role: userRoles.role,
        tenantId: userRoles.tenantId,
      })
      .from(userRoles)
      .where(
        and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId)),
      );

    return Ok(result);
  }

  // Set user role for a tenant
  async setUserRole(
    userId: string,
    tenantId: string,
    role: "Admin" | "Gerente" | "Personal" | "Cliente",
  ): Promise<Result<void, DomainError>> {
    // Verify user exists
    const userCheck = await this.getUserById(userId);
    if (isFailure(userCheck)) {
      return userCheck;
    }

    // Verify tenant exists
    const tenantCheck = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenantCheck.length === 0) {
      return Err(
        ErrorFactories.notFound(
          "Tenant",
          tenantId,
          `Tenant with ID ${tenantId} not found`,
        ),
      );
    }

    // Check if role already exists
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(
        and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId)),
      )
      .limit(1);

    if (existingRole.length > 0) {
      // Update existing role
      await db
        .update(userRoles)
        .set({ role, updatedAt: new Date() })
        .where(eq(userRoles.id, existingRole[0].id));
    } else {
      // Create new role
      await db.insert(userRoles).values({
        userId,
        tenantId,
        role,
      });
    }

    return Ok(undefined);
  }

  // Helper methods
  private async verifyPassword(
    password: string,
    user: User,
  ): Promise<boolean> {
    if (!user.password) {
      return false; // Users without a password cannot log in this way
    }
    return bcrypt.compare(password, user.password);
  }

  private generateAuthToken(user: User): string {
    // Mock token generation - in real implementation, use JWT
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }
}

// Export singleton instance
export const userService = new UserService();
