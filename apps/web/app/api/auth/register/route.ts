import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@sass-store/database";
import { users } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { registerSchema } from "@sass-store/validation/schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('[Register API] Failed to parse JSON:', jsonError);
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      );
    }
    console.log('[Register API] Received body:', JSON.stringify(body, null, 2));

    // Validate with Zod
    const validated = registerSchema.parse(body);
    console.log('[Register API] Validation passed:', validated);
    const { name, email, password, tenantSlug } = validated;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user - generate a unique ID (text format for compatibility with NextAuth)
    const userId = `user_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`;

    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        name,
        email,
        password: hashedPassword,
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Return success (don't send password back)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('[Register API] Zod validation error:', JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error al crear la cuenta. Por favor intenta de nuevo." },
      { status: 500 }
    );
  }
}
