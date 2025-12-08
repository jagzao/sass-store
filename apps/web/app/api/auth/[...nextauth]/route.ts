import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy handler for NextAuth requests
 * Forwards all /api/auth/* requests to the API server
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> },
) {
  return proxyToAuthServer(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> },
) {
  return proxyToAuthServer(request, await params);
}

async function proxyToAuthServer(
  request: NextRequest,
  params: { nextauth: string[] },
) {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://127.0.0.1:4000";
  const authPath = params.nextauth?.join("/") || "";
  const targetUrl = `${apiUrl}/api/auth/${authPath}`;

  console.log("[NextAuth Proxy] Forwarding:", {
    from: request.url,
    to: targetUrl,
    method: request.method,
  });

  try {
    // Forward the request to the API server
    const headers = new Headers(request.headers);
    // Remove host header to avoid confusion
    headers.delete("host");

    const init: RequestInit = {
      method: request.method,
      headers,
    };

    // Forward body for POST requests
    if (request.method === "POST") {
      const body = await request.text();
      init.body = body;
    }

    const response = await fetch(targetUrl + request.nextUrl.search, init);

    // Get response body
    const responseBody = await response.text();

    console.log("[NextAuth Proxy] Response:", {
      status: response.status,
      ok: response.ok,
    });

    // Forward the response
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error("[NextAuth Proxy] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to proxy auth request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
