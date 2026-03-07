import { NextRequest, NextResponse } from "next/server";
import { inventoryExpenseLinkService } from "@/lib/services/InventoryExpenseLinkService";
import { isSuccess } from "@sass-store/core/src/result";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../_lib/tenant-context";

// Validation schema for marking product as supply
const MarkAsSupplySchema = z.object({
  isSupply: z.boolean().default(true),
  expenseCategoryId: z.string().uuid().optional(),
  autoCreateExpense: z.boolean().default(true),
  expenseDescriptionTemplate: z.string().optional(),
});

const CreateLinkSchema = z.object({
  productId: z.string().uuid(),
  inventoryTransactionId: z.string().uuid(),
  quantity: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid quantity format"),
  unitCost: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid cost format"),
  expenseCategoryId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/inventory/expense-links - Get expense links for tenant
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    let result;
    if (productId) {
      result = await inventoryExpenseLinkService.getExpenseLinksByProduct(productId);
    } else {
      result = await inventoryExpenseLinkService.getExpenseLinksByTenant(
        tenantContext.data.tenantId,
      );
    }

    if (!isSuccess(result)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: result.error.message, type: result.error.type },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error fetching expense links:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}

/**
 * POST /api/inventory/expense-links - Create manual expense link
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const body = await request.json();

    // Validate body
    const validation = CreateLinkSchema.safeParse(body);
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

    const result = await inventoryExpenseLinkService.createManualExpenseLink({
      ...validation.data,
      tenantId: tenantContext.data.tenantId,
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
    console.error("Error creating expense link:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
