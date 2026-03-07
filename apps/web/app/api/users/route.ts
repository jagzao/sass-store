import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { UserService } from "@/lib/services/UserService";
import {
  authenticateRequest,
  AuthenticatedRequest,
} from "@sass-store/core/src/middleware/auth-middleware";
import { Err, Ok } from "@sass-store/core/src/result";
import { ErrorFactories, DomainError } from "@sass-store/core/src/errors/types";

// Schemas for validation - matching UserService types
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["admin", "staff", "customer"]).default("customer"),
});

const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(["admin", "staff", "customer"]).optional(),
  isActive: z.boolean().optional(),
});

const userService = new UserService();

// GET /api/users - Get user(s)
export const GET = withResultHandler<any, DomainError>(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const email = searchParams.get("email");

  // Authenticate the request
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return authResult;
  }

  const user = authResult.success ? authResult.data.user : null;

  if (userId) {
    // Get specific user by ID
    // Accept any string ID for demo purposes
    if (!userId || userId.trim().length === 0) {
      return Err(
        ErrorFactories.validation(
          "invalid_user_id",
          "User ID is required",
        ),
      );
    }

    const userResult = await userService.getUserById(userId);
    if (!userResult.success) {
      return userResult;
    }

    // Check if user is requesting their own data or is admin
    if (user?.role !== "admin" && userId !== user?.userId) {
      return Err(
        ErrorFactories.authorization(
          "You can only access your own user data",
          "user_access",
        ),
      );
    }

    return userResult;
  } else if (email) {
    // Get user by email
    const userResult = await userService.findUserByEmail(email);
    if (!userResult.success) {
      return userResult;
    }

    // Check if user is requesting their own data or is admin
    if (user?.role !== "admin" && email !== user?.email) {
      return Err(
        ErrorFactories.authorization(
          "You can only access your own user data",
          "user_access",
        ),
      );
    }

    // Return the user (or null if not found)
    return Ok(userResult.data);
  } else {
    // Get all users (admin only)
    if (user?.role !== "admin") {
      return Err(
        ErrorFactories.authorization(
          "Admin access required to list all users",
          "admin_required",
        ),
      );
    }

    return await userService.getAllUsers();
  }
});

// POST /api/users - Create new user
export const POST = withResultHandler<any, DomainError>(async (request: NextRequest) => {
  const body = await request.json();
  const validation = validateWithZod(CreateUserSchema, body);
  if (!validation.success) {
    return validation;
  }

  const { email, password, firstName, lastName, role } = validation.data;

  // Check if user already exists
  const existingUser = await userService.findUserByEmail(email);
  if (!existingUser.success) {
    return existingUser;
  }

  if (existingUser.data) {
    return Err(
      ErrorFactories.validation(
        "user_exists",
        "A user with this email already exists",
      ),
    );
  }

  return await userService.createUser({
    email,
    password,
    firstName,
    lastName,
    role,
  });
});

// PUT /api/users - Update user
export const PUT = withResultHandler<any, DomainError>(async (request: NextRequest) => {
  // Authenticate the request
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return Err(
      ErrorFactories.validation(
        "missing_user_id",
        "User ID is required for updates",
      ),
    );
  }

  // Accept any string ID for demo purposes
  if (!userId || userId.trim().length === 0) {
    return Err(
      ErrorFactories.validation(
        "invalid_user_id",
        "User ID is required",
      ),
    );
  }

  const body = await request.json();
  const validation = validateWithZod(UpdateUserSchema, body);
  if (!validation.success) {
    return validation;
  }

  const user = authResult.success ? authResult.data.user : null;

  // Check if user is updating their own data or is admin
  if (user?.role !== "admin" && userId !== user?.userId) {
    return Err(
      ErrorFactories.authorization(
        "You can only update your own user data",
        "user_update",
      ),
    );
  }

  // Non-admins cannot change roles
  if (user?.role !== "admin" && validation.data.role) {
    return Err(
      ErrorFactories.authorization(
        "Only admins can change user roles",
        "role_change",
      ),
    );
  }

  return await userService.updateUser(userId, validation.data);
});

// DELETE /api/users - Deactivate user (soft delete)
export const DELETE = withResultHandler<any, DomainError>(async (request: NextRequest) => {
  // Authenticate the request
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return Err(
      ErrorFactories.validation(
        "missing_user_id",
        "User ID is required for deactivation",
      ),
    );
  }

  // Accept any string ID for demo purposes
  if (!userId || userId.trim().length === 0) {
    return Err(
      ErrorFactories.validation(
        "invalid_user_id",
        "User ID is required",
      ),
    );
  }

  const user = authResult.success ? authResult.data.user : null;

  // Check if user is deactivating their own account or is admin
  if (user?.role !== "admin" && userId !== user?.userId) {
    return Err(
      ErrorFactories.authorization(
        "You can only deactivate your own account",
        "user_deactivate",
      ),
    );
  }

  return await userService.deactivateUser(userId);
});
