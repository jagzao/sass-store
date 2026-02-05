import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { UserService } from "../../../../lib/services/UserService";
import { createAuthToken } from "@sass-store/core/src/middleware/auth-middleware";
import { Ok, Err } from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";

// Schema for registration
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(["customer", "admin", "staff"]).default("customer"),
});

const userService = new UserService();

// POST /api/auth/register - User registration
export async function POST(request: NextRequest) {
  return withResultHandler(async (req: NextRequest) => {
    const body = await req.json();
    const validation = validateWithZod(RegisterSchema, body);

    if (!validation.success) {
      return validation;
    }

    const { email, password, firstName, lastName, role } = validation.data;

    // Check if user already exists
    const allUsersResult = await userService.getAllUsers();
    if (!allUsersResult.success) {
      return allUsersResult;
    }

    const existingUser = allUsersResult.data.find((u) => u.email === email);
    if (existingUser) {
      return Err(
        ErrorFactories.validation(
          "email_already_exists",
          "A user with this email already exists",
          "email",
        ),
      );
    }

    // Create new user
    const createUserResult = await userService.createUser({
      email,
      firstName,
      lastName,
      role,
    });

    if (!createUserResult.success) {
      return createUserResult;
    }

    // Create auth token for auto-login
    const tokenResult = createAuthToken({
      id: createUserResult.data.id,
      email: createUserResult.data.email,
      role: createUserResult.data.role,
    });

    if (!tokenResult.success) {
      return tokenResult;
    }

    return Ok({
      user: {
        id: createUserResult.data.id,
        email: createUserResult.data.email,
        firstName: createUserResult.data.firstName,
        lastName: createUserResult.data.lastName,
        role: createUserResult.data.role,
      },
      token: tokenResult.data,
    });
  })(request);
}
