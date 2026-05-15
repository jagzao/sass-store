import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { quotes } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { withTenantContextFromParams } from "@/lib/db/tenant-context";
import { z } from "zod";

const updateQuoteSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  status: z
    .enum(["pending", "accepted", "rejected", "expired", "converted"])
    .optional(),
  notes: z.string().optional(),
  totalAmount: z.number().nonnegative().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  const resolvedParams = await params;
  return withTenantContextFromParams(
    request,
    resolvedParams as any,
    async (req, tenantId) => {
      try {
        const quote = await db.query.quotes.findFirst({
          where: and(
            eq(quotes.id, resolvedParams.id),
            eq(quotes.tenantId, tenantId),
          ),
          with: {
            items: true,
          },
        });

        if (!quote) {
          return NextResponse.json(
            { error: "Quote not found" },
            { status: 404 },
          );
        }

        return NextResponse.json(quote);
      } catch (error) {
        console.error("Error fetching quote:", error);
        return NextResponse.json(
          { error: "Failed to fetch quote" },
          { status: 500 },
        );
      }
    },
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  const resolvedParams = await params;
  return withTenantContextFromParams(
    request,
    resolvedParams as any,
    async (req, tenantId) => {
      try {
        const body = await req.json();
        const validatedData = updateQuoteSchema.parse(body);

        // Verify existence first
        const existingQuote = await db.query.quotes.findFirst({
          where: and(
            eq(quotes.id, resolvedParams.id),
            eq(quotes.tenantId, tenantId),
          ),
        });

        if (!existingQuote) {
          return NextResponse.json(
            { error: "Quote not found" },
            { status: 404 },
          );
        }

        const [updatedQuote] = await db
          .update(quotes)
          .set({
            ...validatedData,
            totalAmount:
              validatedData.totalAmount !== undefined
                ? validatedData.totalAmount.toString()
                : undefined,
            updatedAt: new Date(),
          })
          .where(eq(quotes.id, resolvedParams.id))
          .returning();

        return NextResponse.json(updatedQuote);
      } catch (error) {
        console.error("Error updating quote:", error);
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: "Validation error", details: error.errors },
            { status: 400 },
          );
        }
        return NextResponse.json(
          { error: "Failed to update quote" },
          { status: 500 },
        );
      }
    },
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  const resolvedParams = await params;
  return withTenantContextFromParams(
    request,
    resolvedParams as any,
    async (req, tenantId) => {
      try {
        const result = await db
          .delete(quotes)
          .where(
            and(
              eq(quotes.id, resolvedParams.id),
              eq(quotes.tenantId, tenantId),
            ),
          )
          .returning();

        if (result.length === 0) {
          return NextResponse.json(
            { error: "Quote not found" },
            { status: 404 },
          );
        }

        return NextResponse.json({ message: "Quote deleted successfully" });
      } catch (error) {
        console.error("Error deleting quote:", error);
        return NextResponse.json(
          { error: "Failed to delete quote" },
          { status: 500 },
        );
      }
    },
  );
}
