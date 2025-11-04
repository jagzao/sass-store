import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@sass-store/database";
import { users } from "@sass-store/database";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { validateSimpleApiKey } from "@sass-store/config";

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const authResult = validateSimpleApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, return mock user data since we don't have real user auth
    // In production, this would get the user from the auth result
    const mockUser = {
      id: "system", // For API-based actions, use a system ID
      name: "Usuario Demo",
      email: "usuario@demo.com",
      phone: null,
      image: null,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ data: mockUser });
  } catch (error) {
    console.error("Users GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Validate API key
    const authResult = validateSimpleApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // For demo purposes, use the dev-user ID
    const userId = "system"; // For API-based actions, use a system ID

    // Check if this is a password change request
    if (body.currentPassword && body.newPassword) {
      const passwordData = changePasswordSchema.parse(body);

      // Get current user with password
      const currentUser = await db
        .select({
          id: users.id,
          password: users.password,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (currentUser.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // For demo, skip password verification
      // In production, you would verify the current password

      // Hash new password
      const hashedPassword = await bcrypt.hash(passwordData.newPassword, 12);

      // Update password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return NextResponse.json({
        message: "Password updated successfully",
      });
    } else {
      // Profile update
      const profileData = updateProfileSchema.parse(body);

      // Update user profile
      await db
        .update(users)
        .set({
          ...profileData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return NextResponse.json({
        message: "Profile updated successfully",
      });
    }
  } catch (error) {
    console.error("Users PUT error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
