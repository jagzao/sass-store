import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory cart storage (replace with database in production)
const carts = new Map<string, any>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    // Get cart from storage or return empty cart
    const cart = carts.get(userId) || { items: [], total: 0 };

    return NextResponse.json(cart);
  } catch (error) {
    console.error("Error loading cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const cartData = await request.json();

    // Save cart to storage
    carts.set(userId, cartData);

    return NextResponse.json({ success: true, cart: cartData });
  } catch (error) {
    console.error("Error saving cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
