import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { db } from "@sass-store/database";
import { menuDesigns } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateMenuSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.record(z.any()).optional(),
  templateId: z.string().optional(),
  isDraft: z.boolean().optional(),
  dimensions: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});

// GET - Single Design
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const design = await db.query.menuDesigns.findFirst({
      where: (menuDesigns, { eq }) => eq(menuDesigns.id, params.id),
    });

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    return NextResponse.json(design);
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// PATCH - Update Design
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateMenuSchema.parse(body);

    const [updated] = await db
      .update(menuDesigns)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(menuDesigns.id, params.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// DELETE - Delete Design
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.delete(menuDesigns).where(eq(menuDesigns.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
