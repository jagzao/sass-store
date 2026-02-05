import { NextRequest } from "next/server";
import { UserService } from "../../../lib/services/UserService";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { Result, Err } from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";

// Schemas for validation
const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(["customer", "admin", "staff"]).optional(),
});

const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.enum(["customer", "admin", "staff"]).optional(),
  isActive: z.boolean().optional(),
});

const userService = new UserService();

// GET /api/users - Get all users
export const GET = withResultHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (userId) {
    // Get specific user
    const uuidValidation = CommonSchemas.uuid.parse(userId);
    if (!uuidValidation.success) {
      return uuidValidation;
    }

    return await userService.getUserById(userId);
  } else {
    // Get all users
    return await userService.getAllUsers();
  }
});

// POST /api/users - Create new user
export const POST = withResultHandler(async (request: NextRequest) => {
  const body = await request.json();
  const validation = validateWithZod(CreateUserSchema, body);
  if (!validation.success) {
    return validation;
  }

  return await userService.createUser(validation.data);
});

// PUT /api/users - Update user
export const PUT = withResultHandler(async (request: NextRequest) => {
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

  const uuidValidation = CommonSchemas.uuid.parse(userId);
  if (!uuidValidation.success) {
    return uuidValidation;
  }

  const body = await request.json();
  const updateValidation = validateWithZod(UpdateUserSchema, body);
  if (!updateValidation.success) {
    return updateValidation;
  }

  return await userService.updateUser(userId, updateValidation.data);
});

// DELETE /api/users - Deactivate user
export const DELETE = withResultHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return Err(
      ErrorFactories.validation(
        "missing_user_id",
        "User ID is required for deletion",
      ),
    );
  }

  const uuidValidation = CommonSchemas.uuid.parse(userId);
  if (!uuidValidation.success) {
    return uuidValidation;
  }

  return await userService.deactivateUser(userId);
});
