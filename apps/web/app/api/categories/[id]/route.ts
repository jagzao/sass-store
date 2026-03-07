import { NextRequest, NextResponse } from "next/server";
import { transactionCategoryService } from "@/lib/services/TransactionCategoryService";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { isSuccess } from "@sass-store/core/src/result";

// Schema for category updates
const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["income", "expense"]).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/categories/[id] - Get a specific category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenant = searchParams.get("tenant");

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { message: "tenant query parameter is required" } },
        { status: 400 },
      );
    }

    const result = await transactionCategoryService.getCategory(id);

    if (!isSuccess(result)) {
      return NextResponse.json(
        { success: false, error: { message: result.error.message, type: result.error.type } },
        { status: 404 },
      );
    }

    // Verify tenant ownership
    if (result.data.tenantId !== tenant) {
      return NextResponse.json(
        { success: false, error: { message: "Category not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/categories/[id] - Update a category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenant = searchParams.get("tenant");

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { message: "tenant query parameter is required" } },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = validateWithZod(UpdateCategorySchema, body);

    if (!isSuccess(validation)) {
      return NextResponse.json(
        { success: false, error: { message: validation.error.message, details: validation.error } },
        { status: 400 },
      );
    }

    // First verify the category exists and belongs to tenant
    const existingResult = await transactionCategoryService.getCategory(id);
    if (!isSuccess(existingResult)) {
      return NextResponse.json(
        { success: false, error: { message: existingResult.error.message } },
        { status: 404 },
      );
    }

    if (existingResult.data.tenantId !== tenant) {
      return NextResponse.json(
        { success: false, error: { message: "Category not found" } },
        { status: 404 },
      );
    }

    const result = await transactionCategoryService.updateCategory(id, validation.data);

    if (!isSuccess(result)) {
      return NextResponse.json(
        { success: false, error: { message: result.error.message, type: result.error.type } },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/categories/[id] - Delete a category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenant = searchParams.get("tenant");

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: { message: "tenant query parameter is required" } },
        { status: 400 },
      );
    }

    // First verify the category exists and belongs to tenant
    const existingResult = await transactionCategoryService.getCategory(id);
    if (!isSuccess(existingResult)) {
      return NextResponse.json(
        { success: false, error: { message: existingResult.error.message } },
        { status: 404 },
      );
    }

    if (existingResult.data.tenantId !== tenant) {
      return NextResponse.json(
        { success: false, error: { message: "Category not found" } },
        { status: 404 },
      );
    }

    const result = await transactionCategoryService.deleteCategory(id);

    if (!isSuccess(result)) {
      return NextResponse.json(
        { success: false, error: { message: result.error.message, type: result.error.type } },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: { message: "Category deleted successfully" } });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
