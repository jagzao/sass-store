import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { services, tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Debug endpoint to test service creation
 * GET /api/debug/test-service-create
 */
export async function GET(request: NextRequest) {
  try {
    console.log("=== TEST SERVICE CREATE DEBUG ===");

    // Find WonderNails tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, "wondernails"))
      .limit(1);

    console.log("Tenant found:", tenant ? "YES" : "NO");
    console.log("Tenant ID:", tenant?.id);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Try to create a test service
    const testPrice = 0.4;
    const formattedPrice = testPrice.toFixed(2);

    console.log("Test price:", testPrice);
    console.log("Formatted price:", formattedPrice);
    console.log("Formatted price type:", typeof formattedPrice);

    const testData = {
      tenantId: tenant.id,
      name: "TEST Service",
      description: "Test description",
      price: formattedPrice,
      imageUrl: "https://res.cloudinary.com/drxcxttn0/image/upload/test.png",
      duration: 30,
      featured: false,
      active: true,
      metadata: null,
    };

    console.log("Attempting to insert:", JSON.stringify(testData, null, 2));

    const [newService] = await db
      .insert(services)
      .values(testData)
      .returning();

    console.log("Service created successfully:", newService?.id);

    return NextResponse.json({
      success: true,
      service: newService,
      debug: {
        tenantId: tenant.id,
        priceOriginal: testPrice,
        priceFormatted: formattedPrice,
        priceType: typeof formattedPrice,
      },
    });
  } catch (error) {
    console.error("=== TEST CREATE ERROR ===");
    console.error("Error:", error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");

    return NextResponse.json(
      {
        error: "Test failed",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
      },
      { status: 500 },
    );
  }
}
