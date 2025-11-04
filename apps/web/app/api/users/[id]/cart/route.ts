import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { userCarts } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify the requesting user matches the target user
    const session = await getServerSession(authOptions);

    if (!session || session.user.id !== id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's cart from database
    const [userCart] = await db
      .select()
      .from(userCarts)
      .where(eq(userCarts.userId, id))
      .limit(1);

    // Return cart items or empty array
    return NextResponse.json({
      cart: userCart ? userCart.items : [],
    });
  } catch (error) {
    console.error("Error getting user cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify the requesting user matches the target user
    const session = await getServerSession(authOptions);

    if (!session || session.user.id !== id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { cart } = await request.json();

    // Validate cart structure
    if (!Array.isArray(cart)) {
      return NextResponse.json(
        { error: "Invalid cart format" },
        { status: 400 }
      );
    }

    // Upsert the user's cart in the database
    await db
      .insert(userCarts)
      .values({
        userId: id,
        items: cart,
      })
      .onConflictDoUpdate({
        target: userCarts.userId,
        set: { items: cart },
      });

    return NextResponse.json({
      success: true,
      message: "Cart updated successfully",
    });
  } catch (error) {
    console.error("Error updating user cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}