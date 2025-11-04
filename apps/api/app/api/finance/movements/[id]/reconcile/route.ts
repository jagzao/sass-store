import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withTenantContext } from "@sass-store/database";
import { financialMovements } from "@sass-store/database";
import { eq } from "drizzle-orm";
import { resolveTenant } from "@/lib/tenant-resolver";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { getActorId } from "@/lib/api-auth";

// Validation schemas
const reconcileSchema = z.object({
  reconciled: z.boolean(),
  reconciliationId: z.string().uuid().optional(),
});

/**
 * PATCH /api/finance/movements/[id]/reconcile
 * Update reconciliation status of a financial movement
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(
      tenant.id,
      "finance:reconcile"
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Validate movement ID
    const movementId = params.id;
    if (!movementId) {
      return NextResponse.json(
        { error: "Movement ID is required" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const reconcileData = reconcileSchema.parse(body);

    // Check if movement exists and belongs to tenant
    const existingMovement = (await withTenantContext(
      db,
      tenant.id,
      null,
      async (db) => {
        return await db
          .select()
          .from(financialMovements)
          .where(eq(financialMovements.id, movementId))
          .limit(1);
      }
    )) as any[];

    if (existingMovement.length === 0) {
      return NextResponse.json(
        { error: "Movement not found" },
        { status: 404 }
      );
    }

    const movement = existingMovement[0];

    // Update reconciliation status
    const updatedMovement = await db
      .update(financialMovements)
      .set({
        reconciled: reconcileData.reconciled,
        reconciliationId: reconcileData.reconciliationId || null,
        updatedAt: new Date(),
      })
      .where(eq(financialMovements.id, movementId))
      .returning();

    // Create audit log
    await createAuditLog({
      tenantId: tenant.id,
      actorId: await getActorId(request),
      action: reconcileData.reconciled
        ? "movement.reconciled"
        : "movement.unreconciled",
      targetTable: "financial_movements",
      targetId: movementId,
      data: {
        previousStatus: movement.reconciled,
        newStatus: reconcileData.reconciled,
        reconciliationId: reconcileData.reconciliationId,
      },
    });

    return NextResponse.json({
      data: updatedMovement[0],
      message: `Movement ${reconcileData.reconciled ? "reconciled" : "marked as unreconciled"} successfully`,
    });
  } catch (error) {
    console.error("Finance movement reconcile error:", error);

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

/**
 * GET /api/finance/movements/[id]/reconcile
 * Get reconciliation status of a financial movement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Validate movement ID
    const movementId = params.id;
    if (!movementId) {
      return NextResponse.json(
        { error: "Movement ID is required" },
        { status: 400 }
      );
    }

    // Get movement reconciliation status
    const movement = (await withTenantContext(
      db,
      tenant.id,
      null,
      async (db) => {
        return await db
          .select({
            id: financialMovements.id,
            reconciled: financialMovements.reconciled,
            reconciliationId: financialMovements.reconciliationId,
          })
          .from(financialMovements)
          .where(eq(financialMovements.id, movementId))
          .limit(1);
      }
    )) as any[];

    if (movement.length === 0) {
      return NextResponse.json(
        { error: "Movement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: movement[0],
    });
  } catch (error) {
    console.error("Finance movement reconcile status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
