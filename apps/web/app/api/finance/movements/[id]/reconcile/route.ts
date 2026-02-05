import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { assertTenantAccess } from "@/lib/auth/api-auth";
import { db } from "@sass-store/database";
import { sql } from "drizzle-orm";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener ID del movimiento
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Movement ID is required" },
        { status: 400 },
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { reconciled = true, reconciliationId, notes, tenantSlug } = body;

    if (!tenantSlug) {
      return NextResponse.json(
        { error: "Tenant parameter is required" },
        { status: 400 },
      );
    }

    // Obtener tenant ID desde el slug
    const tenantResult = await db.execute(
      sql`SELECT id FROM tenants WHERE slug = ${tenantSlug}`,
    );

    if (!tenantResult.rows || tenantResult.rows.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenantResult.rows[0].id;

    // Validar acceso al tenant
    try {
      assertTenantAccess(session, tenantSlug);
    } catch (error) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to this tenant" },
        { status: 403 },
      );
    }

    // Verificar que el movimiento existe y pertenece al tenant
    const movementResult = await db.execute(
      sql`
        SELECT id, type, amount, reconciled
        FROM financial_movements
        WHERE id = ${id}
          AND tenant_id = ${tenantId}
      `,
    );

    if (!movementResult.rows || movementResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Movement not found" },
        { status: 404 },
      );
    }

    const movement = movementResult.rows[0];

    // Si se está marcando como reconciliado, verificar que no lo esté ya
    if (reconciled && movement.reconciled) {
      return NextResponse.json(
        { error: "Movement is already reconciled" },
        { status: 400 },
      );
    }

    // Actualizar el movimiento
    const updateResult = await db.execute(
      sql`
        UPDATE financial_movements
        SET 
          reconciled = ${reconciled},
          reconciliation_id = ${reconciliationId || null},
          updated_at = NOW()
        WHERE id = ${id}
          AND tenant_id = ${tenantId}
        RETURNING id, reconciled, reconciliation_id, updated_at
      `,
    );

    const updatedMovement = updateResult.rows[0];

    // Si se proporcionaron notas, guardarlas en el log de reconciliación
    if (notes) {
      await db.execute(
        sql`
          INSERT INTO reconciliation_logs (
            movement_id,
            user_id,
            action,
            notes,
            created_at
          ) VALUES (
            ${id},
            ${session.user.id},
            ${reconciled ? "reconcile" : "unreconcile"},
            ${notes},
            NOW()
          )
        `,
      );
    }

    // Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      message: `Movement ${reconciled ? "reconciled" : "unreconciled"} successfully`,
      data: {
        id: updatedMovement.id,
        reconciled: updatedMovement.reconciled,
        reconciliationId: updatedMovement.reconciliation_id,
        updatedAt: updatedMovement.updated_at,
      },
    });
  } catch (error) {
    console.error("Error reconciling movement:", error);
    return NextResponse.json(
      { error: "Failed to reconcile movement" },
      { status: 500 },
    );
  }
}
