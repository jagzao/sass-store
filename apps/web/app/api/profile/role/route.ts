import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { tenants, users } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { assertTenantAccess, TenantAccessError } from "@/lib/auth/api-auth";
import {
  assignUserRole,
  canAssignRole,
  Role,
  DatabaseRole,
} from "@sass-store/database/rbac";

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

// Map database role strings to Role enum
const roleMapping: Record<string, Role> = {
  Admin: Role.TENANT_ADMIN,
  Gerente: Role.MANAGER,
  Personal: Role.STAFF,
  Cliente: Role.CUSTOMER,
};

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
      return NextResponse.json(
        { error: "No tienes acceso a este tenant" },
        { status: 403 }
      );
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

    // ✅ Mapear el roleId string al enum Role
    const targetRole = roleMapping[roleId];
    if (!targetRole) {
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 }
      );
    }

    // ✅ Verificar si el usuario actual puede asignar este rol
    const canAssign = await canAssignRole(
      session.user.id,
      targetRole,
      tenantId
    );

    if (!canAssign) {
      return NextResponse.json(
        {
          error: "No tienes permisos para asignar este rol",
          details:
            "Solo los administradores pueden asignar roles a otros usuarios",
        },
        { status: 403 }
      );
    }

    // ✅ Usar la función RBAC para asignar el rol (incluye validaciones y audit log)
    const result = await assignUserRole({
      userId,
      tenantId,
      role: targetRole,
      assignedBy: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: result.message.includes("not found") ? 404 : 400 }
      );
    }

    // ✅ Respuesta exitosa
    return NextResponse.json({
      message: "Rol actualizado correctamente",
      data: {
        userId,
        tenantId,
        role: roleId,
        updatedBy: session.user.id,
      },
    });
  } catch (error) {
    console.error("Role PUT error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof TenantAccessError) {
      return NextResponse.json(
        { error: "No tienes acceso a este tenant" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
