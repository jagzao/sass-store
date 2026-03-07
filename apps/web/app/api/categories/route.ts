import { NextRequest, NextResponse } from "next/server";
import { transactionCategoryService } from "@/lib/services/TransactionCategoryService";
import { isSuccess } from "@sass-store/core/src/result";
import { z } from "zod";

// Validation schemas
const QuerySchema = z.object({
  tenant: z.string().min(1, "Tenant parameter is required"),
  type: z.enum(["income", "expense"]).optional(),
});

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

    const result = type
      ? await transactionCategoryService.getCategoriesByType(tenant, type)
      : await transactionCategoryService.getCategoriesByTenant(tenant);

    if (!isSuccess(result)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: result.error.message, type: result.error.type },
        },
        { status: result.error.type === "NotFoundError" ? 404 : 500 },
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
      tenantId: tenant,
    });

    if (!isSuccess(result)) {
      const statusCode =
        result.error.type === "ValidationError"
          ? 400
          : result.error.type === "NotFoundError"
            ? 404
            : result.error.type === "BusinessRuleError"
              ? 409
              : 500;

      return NextResponse.json(
        {
          success: false,
          error: { message: result.error.message, type: result.error.type },
        },
        { status: statusCode },
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
