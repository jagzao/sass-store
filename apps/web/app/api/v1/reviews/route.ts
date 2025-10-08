import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/connection';
import { productReviews } from '@sass-store/database/schema';
import { eq, and, desc } from 'drizzle-orm';

// Validation schemas
const createReviewSchema = z.object({
  productId: z.string().uuid(),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email().max(255).optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().optional(),
});

const updateReviewSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  helpful: z.number().int().min(0).optional(),
  reported: z.number().int().min(0).optional(),
});

// GET /api/v1/reviews - List reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const conditions = [eq(productReviews.productId, productId)];
    if (status) {
      conditions.push(eq(productReviews.status, status));
    }

    const reviews = await db
      .select()
      .from(productReviews)
      .where(and(...conditions))
      .orderBy(desc(productReviews.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/reviews - Create review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    const [newReview] = await db
      .insert(productReviews)
      .values({
        ...validatedData,
        tenantId: request.headers.get('x-tenant-id') as string,
        status: 'pending', // Default to pending for moderation
      })
      .returning();

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
