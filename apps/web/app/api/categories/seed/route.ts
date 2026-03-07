import { NextRequest, NextResponse } from "next/server";
import { transactionCategoryService } from "@/lib/services/TransactionCategoryService";
import { isSuccess } from "@sass-store/core/src/result";

/**
 * POST /api/categories/seed - Create default categories for a tenant
 *
 * This endpoint creates the default set of income and expense categories
 * for a tenant that doesn't have them yet.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "tenantId is required in request body" },
        },
        { status: 400 },
      );
    }

    const result =
      await transactionCategoryService.createDefaultCategories(tenantId);

    if (!isSuccess(result)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: result.error.message, type: result.error.type },
        },
        { status: 500 },
      );
    }

    const incomeCount = result.data.filter((c) => c.type === "income").length;
    const expenseCount = result.data.filter((c) => c.type === "expense").length;

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Default categories created successfully",
          categoriesCreated: result.data.length,
          incomeCategories: incomeCount,
          expenseCategories: expenseCount,
          categories: result.data,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error seeding categories:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
