import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { serviceQuotes, services } from "@sass-store/database/schema";
import { eq, desc, and } from "drizzle-orm";
import { withTenantContextFromParams } from "@/lib/db/tenant-context";
import { z } from "zod";

// Schema for creating a quote
const createQuoteSchema = z.object({
  serviceId: z.string().uuid(),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  validityDays: z.number().int().positive().default(7),
  termsConditions: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } },
) {
  return withTenantContextFromParams(request, params, async (req, tenantId) => {
    try {
      const body = await req.json();
      const validatedData = createQuoteSchema.parse(body);

      // Verify service exists and belongs to tenant
      const service = await db.query.services.findFirst({
        where: and(
          eq(services.id, validatedData.serviceId),
          eq(services.tenantId, tenantId),
        ),
      });

      if (!service) {
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 },
        );
      }

      // Generate quote number (e.g., Q-TIMESTAMP-RANDOM)
      // A collision is unlikely but possible, checking or using sequence logic matches best practice,
      // but simplistic approach works for now.
      const quoteNumber = `Q-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validatedData.validityDays);

      const [newQuote] = await db
        .insert(serviceQuotes)
        .values({
          tenantId,
          serviceId: validatedData.serviceId,
          quoteNumber,
          name: service.name, // Snapshot of service name
          description: service.description,
          price: service.price, // Snapshot of current price
          duration: service.duration,
          validityDays: validatedData.validityDays,
          termsConditions: validatedData.termsConditions,
          customerName: validatedData.customerName,
          customerEmail: validatedData.customerEmail || null,
          customerPhone: validatedData.customerPhone || null,
          notes: validatedData.notes,
          status: "pending",
          expiresAt,
        })
        .returning();

      return NextResponse.json(newQuote, { status: 201 });
    } catch (error) {
      console.error("Error creating quote:", error);
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.errors },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Failed to create quote" },
        { status: 500 },
      );
    }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } },
) {
  return withTenantContextFromParams(request, params, async (req, tenantId) => {
    try {
      const allQuotes = await db.query.serviceQuotes.findMany({
        where: eq(serviceQuotes.tenantId, tenantId),
        orderBy: [desc(serviceQuotes.createdAt)],
        with: {
          service: {
            columns: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      });

      return NextResponse.json(allQuotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      return NextResponse.json(
        { error: "Failed to fetch quotes" },
        { status: 500 },
      );
    }
  });
}
