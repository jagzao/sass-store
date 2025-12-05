import { NextResponse } from "next/server";

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";
  const tenantUrl = `${apiUrl}/api/tenants/wondernails`;

  try {
    console.log(`[test-tenant] Fetching from: ${tenantUrl}`);

    const response = await fetch(tenantUrl, {
      next: { revalidate: 3600 },
    });

    console.log(`[test-tenant] Response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({
        success: false,
        status: response.status,
        statusText: response.statusText,
        body: text,
        url: tenantUrl,
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      status: response.status,
      data: data,
      url: tenantUrl,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      url: tenantUrl,
    });
  }
}
