import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@sass-store/database";
import { users } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { signIn } from "@/lib/auth";
import { loginSchema } from "@sass-store/validation/schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validated = loginSchema.parse(body);
    const { email, password, tenantSlug } = validated;

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json(
        { error: "Usuario sin contraseña configurada. Intenta con Google." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Login successful - Create NextAuth session
    // We need to create a JWT token that NextAuth can recognize
    const loginResult = await signIn("credentials", {
      email: user.email,
      password: user.password,
      redirect: false,
    });

    if (loginResult?.error) {
      return NextResponse.json(
        { error: "Error al crear sesión" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error al iniciar sesión. Por favor intenta de nuevo." },
      { status: 500 }
    );
  }
}
