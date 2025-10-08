import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@sass-store/database";
import { users } from "@sass-store/database/schema";
import { eq, and, gt } from "drizzle-orm";
import { resetPasswordSchema } from "@sass-store/validation/schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validated = resetPasswordSchema.parse(body);
    const { token, password } = validated;

    // Find user with valid token
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.resetToken, token),
          gt(users.resetTokenExpiry, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .where(eq(users.id, user.id));

    return NextResponse.json(
      {
        success: true,
        message: "Contraseña restablecida exitosamente",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    // SECURITY: Redacted sensitive log;
    return NextResponse.json(
      { error: "Error al restablecer la contraseña. Por favor intenta de nuevo." },
      { status: 500 }
    );
  }
}
