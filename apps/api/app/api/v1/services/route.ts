import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@sass-store/database";
import { withTenantContext } from "@sass-store/database";
import { services } from "@sass-store/database";
import { eq, and } from "drizzle-orm";
import { resolveTenant } from "@/lib/tenant-resolver";
import { validateApiKey } from "@sass-store/config";
import { createAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { requirePermission, Permission } from "@sass-store/database";

// Validation schemas
const getServicesSchema = z.object({
  featured: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("20"),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("0"),
});

const createServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  duration: z.number().int().positive(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // ✅ RBAC: Require authentication and tenant access
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(tenant.id, "services:list");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const params = getServicesSchema.parse(queryParams);

    // Build query conditions
    const conditions = [eq(services.tenantId, tenant.id)];

    if (params.featured !== undefined) {
      conditions.push(eq(services.featured, params.featured));
    }

    const whereConditions = and(...conditions);

    // Execute query with pagination using RLS context
    const serviceList = await withTenantContext(db, tenant.id, null,  async (db) => {
      return await db
        .select()
        .from(services)
        .where(whereConditions)
        .limit(params.limit)
        .offset(params.offset)
        .orderBy(services.createdAt);
    });

    return NextResponse.json({
      data: serviceList,
      pagination: {
        limit: params.limit,
        offset: params.offset,
        total: serviceList.length, // In production, would need a separate count query
      },
    });
  } catch (error) {
    console.error("Services GET error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ RBAC: Require authentication and tenant access
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
    const rateLimitResult = await checkRateLimit(tenant.id, "services:create");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const serviceData = createServiceSchema.parse(body);

    // Create service with RLS context
    const newService = await withTenantContext(
      db,
      tenant.id,
      null,
      async (db) => {
        return await db
          .insert(services)
          .values({
            tenantId: tenant.id,
            ...serviceData,
            price: serviceData.price.toString(), // Convert to string for decimal storage
          })
          .returning();
      }
    );

    // Create audit log
    await createAuditLog({
      tenantId: tenant.id,
      actorId: "system", // For API-based actions, use a system actor
      action: "service:create",
      targetTable: "services",
      targetId: newService[0].id,
      data: { created: serviceData },
    });

    return NextResponse.json({ data: newService[0] }, { status: 201 });
  } catch (error) {
    console.error("Services POST error:", error);

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
