import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { quotes, quoteItems } from "@sass-store/database/schema";
import { eq, desc } from "drizzle-orm";
import { withTenantContextFromParams } from "@/lib/db/tenant-context";
import { z } from "zod";

// Schema for creating a quote item
const createQuoteItemSchema = z.object({
  type: z.enum(["service", "product"]),
  itemId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().positive(),
  subtotal: z.number().nonnegative(),
});

// Schema for creating a quote
const createQuoteSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  validityDays: z.number().int().positive().default(15),
  totalAmount: z.number().nonnegative(),
  items: z.array(createQuoteItemSchema).min(1, "At least one item is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  return withTenantContextFromParams(request, params, async (req, tenantId) => {
    try {
      const body = await req.json();
      const validatedData = createQuoteSchema.parse(body);

      // Generate quote number (e.g., Q-TIMESTAMP-RANDOM)
      const quoteNumber = `Q-${Date.now().toString().slice(-6)}-${Math.floor(
        Math.random() * 1000,
      )}`;

      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validatedData.validityDays);

      // Transaction to create quote and items
      const newQuote = await db.transaction(async (tx) => {
        const [quote] = await tx
          .insert(quotes)
          .values({
            tenantId,
            quoteNumber,
            customerName: validatedData.customerName,
            customerEmail: validatedData.customerEmail || null,
            customerPhone: validatedData.customerPhone || null,
            totalAmount: validatedData.totalAmount.toString(),
            notes: validatedData.notes,
            status: "pending",
            validityDays: validatedData.validityDays,
            expiresAt,
          })
          .returning();

        if (validatedData.items.length > 0) {
          await tx.insert(quoteItems).values(
            validatedData.items.map((item) => ({
              quoteId: quote.id,
              type: item.type,
              itemId: item.itemId,
              name: item.name,
              description: item.description,
              unitPrice: item.unitPrice.toString(),
              quantity: item.quantity.toString(),
              subtotal: item.subtotal.toString(),
            })),
          );
        }

        return quote;
      });

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
  { params }: { params: Promise<{ tenant: string }> },
) {
  return withTenantContextFromParams(request, params, async (req, tenantId) => {
    try {
      const allQuotes = await db.query.quotes.findMany({
        where: eq(quotes.tenantId, tenantId),
        orderBy: [desc(quotes.createdAt)],
        with: {
          items: true,
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
