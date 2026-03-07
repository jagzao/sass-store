import { NextRequest, NextResponse } from "next/server";
import { inventoryExpenseLinkService } from "@/lib/services/InventoryExpenseLinkService";
import { isSuccess } from "@sass-store/core/src/result";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../../_lib/tenant-context";

/**
 * GET /api/inventory/expense-links/[id] - Get specific expense link
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const { id } = params;

    const result = await inventoryExpenseLinkService.getExpenseLink(id);

    if (!isSuccess(result)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: result.error.message, type: result.error.type },
        },
        { status: result.error.type === "NotFoundError" ? 404 : 500 },
      );
    }

    // Verify tenant ownership
    if (result.data.tenantId !== tenantContext.data.tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Expense link not found", type: "NotFoundError" },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error fetching expense link:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/inventory/expense-links/[id] - Cancel expense link
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const { id } = params;
    const body = await request.json();
    const { reason } = body;

    // First verify ownership
    const existingResult = await inventoryExpenseLinkService.getExpenseLink(id);
    if (!isSuccess(existingResult)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: existingResult.error.message, type: existingResult.error.type },
        },
        { status: existingResult.error.type === "NotFoundError" ? 404 : 500 },
      );
    }

    if (existingResult.data.tenantId !== tenantContext.data.tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Expense link not found", type: "NotFoundError" },
        },
        { status: 404 },
      );
    }

    const result = await inventoryExpenseLinkService.cancelExpenseLink(id, reason);

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

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error cancelling expense link:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/inventory/expense-links/[id] - Delete expense link
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const { id } = params;

    // First verify ownership
    const existingResult = await inventoryExpenseLinkService.getExpenseLink(id);
    if (!isSuccess(existingResult)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: existingResult.error.message, type: existingResult.error.type },
        },
        { status: existingResult.error.type === "NotFoundError" ? 404 : 500 },
      );
    }

    if (existingResult.data.tenantId !== tenantContext.data.tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Expense link not found", type: "NotFoundError" },
        },
        { status: 404 },
      );
    }

    const result = await inventoryExpenseLinkService.deleteExpenseLink(id);

    if (!isSuccess(result)) {
      const statusCode =
        result.error.type === "ValidationError"
          ? 400
          : result.error.type === "NotFoundError"
            ? 404
            : 500;

      return NextResponse.json(
        {
          success: false,
          error: { message: result.error.message, type: result.error.type },
        },
        { status: statusCode },
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Expense link deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting expense link:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
