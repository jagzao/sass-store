import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { serviceQuotes, services } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { withTenantContextFromParams } from "@/lib/db/tenant-context";

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string; id: string } },
) {
  return withTenantContextFromParams(request, params, async (req, tenantId) => {
    try {
      // Find the quote
      const quote = await db.query.serviceQuotes.findFirst({
        where: and(
          eq(serviceQuotes.id, params.id),
          eq(serviceQuotes.tenantId, tenantId),
        ),
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
        // Create service based on quote
        const [created] = await tx
          .insert(services)
          .values({
            tenantId,
            name: quote.name,
            description: quote.description,
            price: quote.price,
            duration: quote.duration,
            active: true,
            featured: false,
            // Copy other fields if available or use defaults
            // Assuming original service image logic is complex to copy unless we query original service
            // but for now minimal copy.
          })
          .returning();

        // Update quote status
        await tx
          .update(serviceQuotes)
          .set({ status: "converted", updatedAt: new Date() })
          .where(eq(serviceQuotes.id, quote.id));

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
