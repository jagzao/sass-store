import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withTenantContext } from "@sass-store/database";
import { tenantConfigs } from "@sass-store/database";
import { eq, and } from "drizzle-orm";
import { resolveTenant } from "@/lib/tenant-resolver";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { getActorId } from "@/lib/api-auth";

// Configuration categories
const CONFIG_CATEGORIES = [
  "payment_methods",
  "pos_settings",
  "notifications",
  "reports",
  "integrations",
  "business_rules",
] as const;

// Validation schemas
const configKeySchema = z.object({
  category: z.enum(CONFIG_CATEGORIES),
  key: z.string().min(1).max(100),
});

const updateConfigSchema = z.object({
  category: z.enum(CONFIG_CATEGORIES),
  key: z.string().min(1).max(100),
  value: z.any(),
  description: z.string().optional(),
});

/**
 * GET /api/finance/config
 * Get all configuration for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(tenant.id, "config:read");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const category = url.searchParams.get("category");

    // Get configurations with RLS context
    const configs = (await withTenantContext(
      db,
      tenant.id,
      null,
      async (db) => {
        const query = db.select().from(tenantConfigs);

        if (category) {
          return await query.where(eq(tenantConfigs.category, category));
        }

        return await query.orderBy(tenantConfigs.category, tenantConfigs.key);
      }
    )) as any[];

    // Group by category for easier consumption
    const groupedConfigs = configs.reduce(
      (acc, config) => {
        if (!acc[config.category]) {
          acc[config.category] = {};
        }
        acc[config.category][config.key] = {
          value: config.value,
          description: config.description,
          updatedAt: config.updatedAt,
        };
        return acc;
      },
      {} as Record<string, Record<string, any>>
    );

    return NextResponse.json({
      data: groupedConfigs,
      categories: CONFIG_CATEGORIES,
    });
  } catch (error) {
    console.error("Config GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finance/config
 * Update or create configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(tenant.id, "config:write");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const configData = updateConfigSchema.parse(body);

    // Update or insert configuration with RLS context
    const result = (await withTenantContext(db, tenant.id, null, async (db) => {
      // First try to update existing config
      const updateResult = await db
        .update(tenantConfigs)
        .set({
          value: configData.value,
          description: configData.description,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tenantConfigs.category, configData.category),
            eq(tenantConfigs.key, configData.key)
          )
        )
        .returning();

      // If no rows updated, insert new config
      if (updateResult.length === 0) {
        return await db
          .insert(tenantConfigs)
          .values({
            tenantId: tenant.id,
            category: configData.category,
            key: configData.key,
            value: configData.value,
            description: configData.description,
          })
          .returning();
      }

      return updateResult;
    })) as any[];

    // Get the previous configuration value to track changes
    const previousConfig = (await withTenantContext(db, tenant.id, null, async (db) => {
      return await db
        .select()
        .from(tenantConfigs)
        .where(
          and(
            eq(tenantConfigs.category, configData.category),
            eq(tenantConfigs.key, configData.key)
          )
        )
        .limit(1);
    }))[0];

    // Create audit log with authenticated user and old value
    await createAuditLog({
      tenantId: tenant.id,
      actorId: await getActorId(request),
      action: "config.updated",
      targetTable: "tenant_configs",
      targetId: result[0].id,
      data: {
        category: configData.category,
        key: configData.key,
        oldValue: previousConfig?.value || null,
        newValue: configData.value,
      },
    });

    return NextResponse.json(
      {
        data: result[0],
        message: "Configuration updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Config POST error:", error);

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
