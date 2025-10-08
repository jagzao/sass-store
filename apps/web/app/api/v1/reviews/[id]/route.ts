import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/connection';
import { productReviews } from '@sass-store/database/schema';
import { eq } from 'drizzle-orm';

const updateReviewSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  helpful: z.number().int().min(0).optional(),
  reported: z.number().int().min(0).optional(),
});

// GET /api/v1/reviews/[id] - Get single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [review] = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, id))
      .limit(1);

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/reviews/[id] - Update review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateReviewSchema.parse(body);

    const [updatedReview] = await db
      .update(productReviews)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(productReviews.id, id))
      .returning();

    if (!updatedReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedReview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/reviews/[id] - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deletedReview] = await db
      .delete(productReviews)
      .where(eq(productReviews.id, id))
      .returning();

    if (!deletedReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
