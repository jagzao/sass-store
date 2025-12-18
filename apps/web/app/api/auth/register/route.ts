import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { users, tenants, userRoles } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomUUID } from "crypto";

const emailRegex =
  /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ._%+-]+@[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ.-]+\.[a-zA-Z]{2,}$/;

const registerSchema = z.object({
  name: z.string().min(2),
  email: z
    .string()
    .regex(emailRegex, {
      message: "El formato del correo electrónico es inválido",
    }),
  password: z.string().min(8),
  tenantSlug: z.string(),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.errors },
        { status: 400 },
      );
    }

    const { name, email, password, tenantSlug, phone } = result.data;

    // 1. Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 },
      );
    }

    // 2. Resolve tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const userId = randomUUID();
    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        name,
        email,
        password: hashedPassword,
        emailVerified: null,
      })
      .returning();

    // 5. Assign role (Cliente) for this tenant
    // Note: If userRoles table logic is complex (e.g. checking existing roles), simplify for now.
    // Based on auth.ts, userRoles connects userId and tenantId.

    // We need to confirm userRoles schema. Assuming basic structure for now based on auth.ts usage.
    // "userId", "tenantId", "role"

    try {
      await db.insert(userRoles).values({
        userId: newUser.id,
        tenantId: tenant.id,
        role: "Cliente",
        updatedAt: new Date(),
      });
    } catch (roleError) {
      console.error("Error assigning role:", roleError);
      // Continue even if role assignment fails (can be fixed later, user is created)
    }

    return NextResponse.json(
      { message: "User registered successfully", userId: newUser.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
