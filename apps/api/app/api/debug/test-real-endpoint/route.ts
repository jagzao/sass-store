import { NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint that tests calling the real customers endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    console.log("[DEBUG test-real-endpoint] searchParams:", {
      search,
      status,
      allParams: Object.fromEntries(searchParams.entries()),
    });

    // Build the URL to call the real endpoint
    const queryParams = new URLSearchParams();
    if (search) queryParams.set("search", search);
    if (status) queryParams.set("status", status);

    const targetUrl = `${request.nextUrl.origin}/api/tenants/wondernails/customers?${queryParams.toString()}`;

    console.log("[DEBUG test-real-endpoint] Calling:", targetUrl);

    const response = await fetch(targetUrl);
    const data = await response.json();

    console.log("[DEBUG test-real-endpoint] Response status:", response.status);
    console.log("[DEBUG test-real-endpoint] Response data:", data);

    return NextResponse.json({
      targetUrl,
      responseStatus: response.status,
      responseOk: response.ok,
      responseData: data,
      originalParams: {
        search,
        status,
        allParams: Object.fromEntries(searchParams.entries()),
      },
    });
  } catch (error) {
    console.error("[DEBUG test-real-endpoint] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
