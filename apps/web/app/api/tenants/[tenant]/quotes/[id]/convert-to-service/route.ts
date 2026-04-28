import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { quotes, services } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { withTenantContextFromParams } from "@/lib/db/tenant-context";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  const resolvedParams = await params;
  return withTenantContextFromParams(request, resolvedParams, async (req, tenantId) => {
    try {
      // Find the quote
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
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      }

      if (quote.status === "converted") {
        return NextResponse.json(
          { error: "Quote already converted" },
          { status: 400 },
        );
      }

      // Start transaction to create service and update quote status
      const newService = await db.transaction(async (tx) => {
        const primaryItem = quote.items[0];

        if (!primaryItem) {
          throw new Error("Quote has no items to convert");
        }

        // Create service based on quote
        const [created] = await tx
          .insert(services)
          .values({
            tenantId,
            name: primaryItem.name,
            description: primaryItem.description || quote.notes,
            price: primaryItem.unitPrice,
            duration: "1.0",
            active: true,
            featured: false,
          })
          .returning();

        // Update quote status
        await tx
          .update(quotes)
          .set({ status: "converted", updatedAt: new Date() })
          .where(eq(quotes.id, quote.id));

        return created;
      });

      return NextResponse.json(newService, { status: 201 });
    } catch (error) {
      console.error("Error converting quote to service:", error);
      return NextResponse.json(
        { error: "Failed to convert quote" },
        { status: 500 },
      );
    }
  });
}
