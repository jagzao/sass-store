import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withTenantContext } from "@sass-store/database";
import { services } from "@sass-store/database";
import { eq, and } from "drizzle-orm";
import { resolveTenant } from "@/lib/tenant-resolver";
import { validateApiKey } from "@sass-store/config";
import { createAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

// Validation schemas
const updateServiceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  duration: z.number().int().positive().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

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

    // Check rate limits
    const rateLimitResult = await checkRateLimit(tenant.id, "services:get");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Get service using RLS context
    const serviceList = await withTenantContext(db, tenant.id, null,  async (db) => {
      return await db
        .select()
        .from(services)
        .where(
          and(eq(services.id, params.id), eq(services.tenantId, tenant.id))
        )
        .limit(1);
    });

    if (serviceList.length === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ data: serviceList[0] });
  } catch (error) {
    console.error("Service GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate API key for write operations
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits for write operations
    const rateLimitResult = await checkRateLimit(tenant.id, "services:update");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const serviceData = updateServiceSchema.parse(body);

    // Check if service exists and belongs to tenant using RLS context
    const existingService = await withTenantContext(
      db,
      tenant.id, null, 
      async (db) => {
        return await db
          .select()
          .from(services)
          .where(
            and(eq(services.id, params.id), eq(services.tenantId, tenant.id))
          )
          .limit(1);
      }
    );

    if (existingService.length === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Update service
    const updateData: any = { ...serviceData };
    if (serviceData.price !== undefined) {
      updateData.price = serviceData.price.toString();
    }

    const updatedService = await db
      .update(services)
      .set(updateData)
      .where(and(eq(services.id, params.id), eq(services.tenantId, tenant.id)))
      .returning();

    // Create audit log
    await createAuditLog({
      tenantId: tenant.id,
      actorId: "system", // For API-based actions, use a system actor
      action: "service:update",
      targetTable: "services",
      targetId: params.id,
      data: { before: existingService[0], after: updatedService[0] },
    });

    return NextResponse.json({ data: updatedService[0] });
  } catch (error) {
    console.error("Service PUT error:", error);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate API key for write operations
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits for write operations
    const rateLimitResult = await checkRateLimit(tenant.id, "services:delete");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Check if service exists and belongs to tenant using RLS context
    const existingService = await withTenantContext(
      db,
      tenant.id, null, 
      async (db) => {
        return await db
          .select()
          .from(services)
          .where(
            and(eq(services.id, params.id), eq(services.tenantId, tenant.id))
          )
          .limit(1);
      }
    );

    if (existingService.length === 0) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Delete service
    await db
      .delete(services)
      .where(and(eq(services.id, params.id), eq(services.tenantId, tenant.id)));

    // Create audit log
    await createAuditLog({
      tenantId: tenant.id,
      actorId: "system", // For API-based actions, use a system actor
      action: "service:delete",
      targetTable: "services",
      targetId: params.id,
      data: { deleted: existingService[0] },
    });

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Service DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
