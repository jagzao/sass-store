import { NextRequest } from "next/server";
import { db } from "@sass-store/database";
import { users, tenants, userRoles } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

// Import Result pattern utilities
import { Result, Ok, Err, flatMap } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

// Enhanced validation schemas with Result pattern
const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: CommonSchemas.email.getSchema(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  tenantSlug: z.string().min(1, "Tenant slug is required"),
  phone: z.string().optional(),
});

// Types
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  tenantSlug: string;
  phone?: string;
}

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  tenantId: string;
  role: string;
  phone?: string;
}

// Service layer functions with Result pattern

/**
 * Check if user exists by email
 */
const checkUserExists = async (
  email: string,
): Promise<Result<boolean, DomainError>> => {
  try {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return Ok(!!existingUser);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "check_user_exists",
        `Failed to check if user exists: ${email}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Resolve tenant by slug
 */
const resolveTenant = async (
  tenantSlug: string,
): Promise<Result<any, DomainError>> => {
  try {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return Err(ErrorFactories.notFound("Tenant", tenantSlug));
    }

    return Ok(tenant);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "resolve_tenant",
        `Failed to resolve tenant: ${tenantSlug}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Create user in database
 */
const createUser = async (
  userData: Omit<RegisterRequest, "tenantSlug">,
): Promise<Result<{ userId: string; hashedPassword: string }, DomainError>> => {
  try {
    const userId = randomUUID();

    // Note: In a real implementation, you'd hash the password here
    const hashedPassword = `hashed_${userData.password}_${Date.now()}`; // Simplified for POC

    await db.insert(users).values({
      id: userId,
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      emailVerified: null,
    });

    return Ok({ userId, hashedPassword });
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "create_user",
        `Failed to create user: ${userData.email}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Assign user role for tenant
 */
const assignUserRole = async (
  userId: string,
  tenantId: string,
  role: string = "Cliente",
): Promise<Result<void, DomainError>> => {
  try {
    await db.insert(userRoles).values({
      userId,
      tenantId,
      role,
      updatedAt: new Date(),
    });

    return Ok(undefined);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "assign_user_role",
        `Failed to assign role to user ${userId}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Complete user registration with Result pattern
 */
const registerUser = async (
  request: NextRequest,
): Promise<Result<UserProfile, DomainError>> => {
  // Parse and validate request body
  const bodyValidation = await request.json().catch(() => null);
  if (!bodyValidation) {
    return Err(
      ErrorFactories.validation(
        "Invalid JSON in request body",
        undefined,
        undefined,
      ),
    );
  }

  const validation = validateWithZod(RegisterSchema, bodyValidation);
  if (!validation.success) {
    return Err(validation.error);
  }

  const { name, email, password, tenantSlug, phone } = validation.data;

  // Check if user already exists
  const userExistsResult = await checkUserExists(email);
  if (!userExistsResult.success) {
    return userExistsResult;
  }

  if (userExistsResult.data) {
    return Err(
      ErrorFactories.businessRule(
        "user_already_exists",
        "User with this email already exists",
        "USER_EXISTS",
      ),
    );
  }

  // Resolve tenant
  const tenantResult = await resolveTenant(tenantSlug);
  if (!tenantResult.success) {
    return tenantResult;
  }

  // Create user
  const userCreationResult = await createUser({ name, email, password, phone });
  if (!userCreationResult.success) {
    return userCreationResult;
  }

  // Assign role
  const roleAssignmentResult = await assignUserRole(
    userCreationResult.data.userId,
    tenantResult.data.id,
  );

  if (!roleAssignmentResult.success) {
    // Log error but don't fail registration completely
    console.error("Failed to assign role:", roleAssignmentResult.error);
  }

  // Return user profile
  return Ok({
    userId: userCreationResult.data.userId,
    name,
    email,
    tenantId: tenantResult.data.id,
    role: "Cliente",
    phone,
  });
};

/**
 * POST /api/auth/register - Register new user using Result Pattern
 */
export const POST = withResultHandler(async (request: NextRequest) => {
  return await registerUser(request);
});
