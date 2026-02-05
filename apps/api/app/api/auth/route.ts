import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { UserService } from "../../../lib/services/UserService";
import {
  createAuthToken,
  authenticateRequest,
  AuthenticatedRequest,
} from "@sass-store/core/src/middleware/auth-middleware";
import { Ok, Err } from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";

// Schema for login
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Schema for registration
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(["customer", "admin", "staff"]).default("customer"),
});

const userService = new UserService();

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  return withResultHandler(async (req: NextRequest) => {
    const body = await req.json();
    const validation = validateWithZod(LoginSchema, body);

    if (!validation.success) {
      return validation;
    }

    const { email, password } = validation.data;

    // For demo purposes, find user by checking all users
    const allUsersResult = await userService.getAllUsers();
    if (!allUsersResult.success) {
      return allUsersResult;
    }

    const user = allUsersResult.data.find((u) => u.email === email);
    if (!user) {
      return Err(
        ErrorFactories.authentication(
          "invalid_credentials",
          "Invalid email or password",
        ),
      );
    }

    // For demo purposes, accept any password if user exists
    // In production, you would hash and verify the password
    if (!password || password.length < 1) {
      return Err(
        ErrorFactories.authentication(
          "invalid_credentials",
          "Invalid email or password",
        ),
      );
    }

    // Create auth token
    const tokenResult = createAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    if (!tokenResult.success) {
      return tokenResult;
    }

    return Ok({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token: tokenResult.data,
    });
  })(request);
}

// GET /api/auth/me - Get current user info
export async function GET(request: NextRequest) {
  return withResultHandler(async (req: NextRequest) => {
    // Authenticate the request
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return authResult;
    }

    const authenticatedRequest = authResult.success
      ? authResult.data
      : (req as AuthenticatedRequest);
    if (!authenticatedRequest.user) {
      return Err(
        ErrorFactories.authentication(
          "missing_token",
          "No user found in request",
        ),
      );
    }

    // Get full user info
    const userResult = await userService.getUserById(
      authenticatedRequest.user.userId,
    );
    if (!userResult.success) {
      return userResult;
    }

    return Ok({
      id: userResult.data.id,
      email: userResult.data.email,
      firstName: userResult.data.firstName,
      lastName: userResult.data.lastName,
      role: userResult.data.role,
      isActive: userResult.data.isActive,
      createdAt: userResult.data.createdAt,
    });
  })(request);
}
