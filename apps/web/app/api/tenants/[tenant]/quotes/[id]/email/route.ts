import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { quotes, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { withTenantContextFromParams } from "@/lib/db/tenant-context";
import { sendQuoteEmail } from "@/lib/email/email-service";
import { z } from "zod";

const sendEmailSchema = z.object({
  email: z.string().email().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  return withTenantContextFromParams(request, params, async (req, tenantId) => {
    try {
      const body = await req.json().catch(() => ({}));
      const validatedData = sendEmailSchema.parse(body);

      // Fetch quote with items and tenant details
      const { id: quoteId } = await params;
      const quote = await db.query.quotes.findFirst({
        where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
        with: {
          items: true,
          tenant: true,
        },
      });

      if (!quote) {
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      }

      // Determine recipient email
      const recipientEmail = validatedData.email || quote.customerEmail;

      if (!recipientEmail) {
        return NextResponse.json(
          { error: "No recipient email provided" },
          { status: 400 },
        );
      }

      // Send email
      await sendQuoteEmail({
        to: recipientEmail,
        quoteNumber: quote.quoteNumber,
        customerName: quote.customerName,
        totalAmount: Number(quote.totalAmount),
        validityDays: quote.validityDays,
        items: quote.items.map((item) => ({
          name: item.name,
          description: item.description || undefined,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        })),
        tenantName: quote.tenant.name,
        // Using branding if available, or defaults
        tenantColor:
          (quote.tenant.branding as any)?.primaryColor || "#4F46E5",
        tenantLogo: (quote.tenant.branding as any)?.logoUrl,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error sending quote email:", error);
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.errors },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }
  });
}
