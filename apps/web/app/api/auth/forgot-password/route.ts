import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { users } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { forgotPasswordSchema } from "@sass-store/validation/schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validated = forgotPasswordSchema.parse(body);
    const { email, tenantSlug } = validated;

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      return NextResponse.json(
        { success: true, message: "Si el correo existe, recibirás un enlace de recuperación" },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token
    await db
      .update(users)
      .set({
        resetToken,
        resetTokenExpiry,
      })
      .where(eq(users.id, user.id));

    // In production, send email here
    // For now, we'll log the reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/t/${tenantSlug}/reset-password?token=${resetToken}`;

    // SECURITY: Redacted sensitive log;
    console.log('📧 Send this link to:', email);

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // await sendPasswordResetEmail(email, resetLink);

    return NextResponse.json(
      {
        success: true,
        message: "Si el correo existe, recibirás un enlace de recuperación",
        // Remove this in production - only for development
        resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
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
      { error: "Error al procesar la solicitud. Por favor intenta de nuevo." },
      { status: 500 }
    );
  }
}
