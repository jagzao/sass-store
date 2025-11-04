import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { tenants, userRoles, staff, users } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { assertTenantAccess, TenantAccessError } from "@/lib/auth/api-auth";

const updateRoleSchema = z
  .object({
    userId: z.string().min(1, "User ID is required"),
    tenantId: z.string().min(1, "Tenant ID is required"),
    roleId: z.enum(["Admin", "Gerente", "Personal", "Cliente"], {
      errorMap: () => ({
        message:
          "Invalid role. Must be one of: Admin, Gerente, Personal, Cliente",
      }),
    }),
  })
  .strict();

export async function PUT(request: NextRequest) {
  try {
    // ✅ Validación temprana del body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    // ✅ Parse seguro con validación mejorada
    const { roleId, tenantId, userId } = updateRoleSchema.parse(body);

    // ✅ Verificación de sesión
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user;
    const sessionRole = (sessionUser.role as string | undefined) ?? "Cliente";

    // ✅ Verificar permisos - Un usuario puede cambiar su propio rol
    // ✅ Solo admins pueden asignar roles a otros usuarios
    if (sessionUser.id !== userId && sessionRole !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Resolver tenant
    const [tenant] = await db
      .select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // ✅ Verificar acceso al tenant
    try {
      assertTenantAccess(session, tenant.slug);
    } catch (accessError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Verificar que el usuario existe
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Ejecutar asignación con manejo de errores robusto
    const now = new Date();

    // ✅ Upsert seguro con validación
    const result = await db
      .insert(userRoles)
      .values({
        userId,
        tenantId: tenant.id,
        role: roleId,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [userRoles.userId, userRoles.tenantId],
        set: {
          role: roleId,
          updatedAt: now,
        },
      })
      .returning({
        id: userRoles.id,
        userId: userRoles.userId,
        tenantId: userRoles.tenantId,
        role: userRoles.role,
        updatedAt: userRoles.updatedAt,
      });

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "Role assignment failed" },
        { status: 500 }
      );
    }

    const [assignment] = result;

    // ✅ Sincronizar staff (con verificación de existencia)
    if (user.email) {
      try {
        await db
          .update(staff)
          .set({ role: roleId, updatedAt: now })
          .where(
            and(eq(staff.tenantId, tenant.id), eq(staff.email, user.email))
          );
      } catch (staffError) {
        console.warn("Failed to update staff record:", staffError);
        // No error fatal - continue with role assignment
      }
    }

    // ✅ Respuesta exitosa
    return NextResponse.json({
      message: "Rol actualizado correctamente",
      data: assignment,
    });
  } catch (error) {
    console.error("Role PUT error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof TenantAccessError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Manejo específico de errores de base de datos
    if (error instanceof Error) {
      if (error.message === "User not found") {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (error.message === "Role assignment failed") {
        return NextResponse.json(
          { error: "Role assignment failed" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
