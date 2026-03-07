import { NextRequest, NextResponse } from "next/server";
import { inventoryExpenseLinkService } from "@/lib/services/InventoryExpenseLinkService";
import { isSuccess } from "@sass-store/core/src/result";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../_lib/tenant-context";

/**
 * GET /api/inventory/supply-report - Get supply expenses summary
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const result = await inventoryExpenseLinkService.getSupplyExpensesSummary(
      tenantContext.data.tenantId,
      start,
      end,
    );

    if (!isSuccess(result)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: result.error.message, type: result.error.type },
        },
        { status: 500 },
      );
    }

    // Calculate totals
    const totalCost = result.data.reduce(
      (sum, item) => sum + parseFloat(item.totalCost),
      0,
    );
    const totalQuantity = result.data.reduce(
      (sum, item) => sum + parseFloat(item.totalQuantity),
      0,
    );
    const totalTransactions = result.data.reduce(
      (sum, item) => sum + item.transactionCount,
      0,
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: result.data,
        totals: {
          totalCost: totalCost.toFixed(2),
          totalQuantity: totalQuantity.toFixed(2),
          totalTransactions,
          productCount: result.data.length,
        },
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching supply report:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
