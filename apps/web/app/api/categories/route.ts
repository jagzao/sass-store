import { NextRequest, NextResponse } from "next/server";
import { transactionCategoryService } from "@/lib/services/TransactionCategoryService";
import { isSuccess } from "@sass-store/core/src/result";
import { getHttpStatusCode } from "@sass-store/core/src/errors/types";
import { db, eq } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { z } from "zod";

const CreateCategorySchema = z.object({
  type: z.enum(["income", "expense"]),
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format")
    .optional(),
  icon: z.string().max(50).optional(),
  isFixed: z.boolean().optional(),
  parentId: z.string().uuid().optional(),
  budgetAlertThreshold: z.number().min(0).max(100).optional(),
  sortOrder: z.number().int().optional(),
});

async function resolveTenantId(
  rawTenant: string,
): Promise<
  | { ok: true; tenantId: string }
  | { ok: false; status: number; body: Record<string, unknown> }
> {
  const uuidCheck = z.string().uuid().safeParse(rawTenant);
  if (uuidCheck.success) {
    return { ok: true, tenantId: uuidCheck.data };
  }

  const rows = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, rawTenant))
    .limit(1);

  const tenantId = rows[0]?.id;
  if (!tenantId) {
    return {
      ok: false,
      status: 404,
      body: {
        success: false,
        error: { message: `Tenant not found for slug ${rawTenant}` },
      },
    };
  }

  return { ok: true, tenantId };
}

/**
 * GET /api/categories - Get transaction categories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant = searchParams.get("tenant");
    const type = searchParams.get("type") as "income" | "expense" | undefined;

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { message: "Tenant parameter is required" } },
        { status: 400 },
      );
    }

    const resolved = await resolveTenantId(tenant);
    if (!resolved.ok) {
      return NextResponse.json(resolved.body, { status: resolved.status });
    }

    const result = type
      ? await transactionCategoryService.getCategoriesByType(
          resolved.tenantId,
          type,
        )
      : await transactionCategoryService.getCategoriesByTenant(
          resolved.tenantId,
        );

    if (!isSuccess(result)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: result.error.message, type: result.error.type },
        },
        { status: getHttpStatusCode(result.error) },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}

/**
 * POST /api/categories - Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenant = searchParams.get("tenant") || body.tenantId;

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { message: "Tenant parameter is required" } },
        { status: 400 },
      );
    }

    const resolved = await resolveTenantId(tenant);
    if (!resolved.ok) {
      return NextResponse.json(resolved.body, { status: resolved.status });
    }

    // Validate body
    const validation = CreateCategorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Validation failed",
            details: validation.error.errors,
          },
        },
        { status: 400 },
      );
    }

    const result = await transactionCategoryService.createCategory({
      ...validation.data,
      tenantId: resolved.tenantId,
    });

    if (!isSuccess(result)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: result.error.message, type: result.error.type },
        },
        { status: getHttpStatusCode(result.error) },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
