import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getErrorMessage(errorCode: string | null): string {
  switch (errorCode) {
    case "Configuration":
      return "OAuth configuration failed. If you are in local dev behind proxy/corporate network, check TLS certificates and Google OAuth env vars.";
    case "AccessDenied":
      return "Access denied by the identity provider.";
    case "Verification":
      return "Verification failed. Please try signing in again.";
    case "OAuthSignin":
    case "OAuthCallback":
      return "Google OAuth handshake failed. Please retry and check your local network/certificate settings.";
    default:
      return "Authentication failed. Please try again.";
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const errorCode = searchParams.get("error");

  return NextResponse.json(
    {
      error: "Authentication error",
      code: errorCode,
      message: getErrorMessage(errorCode),
    },
    { status: 400 },
  );
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const errorCode = searchParams.get("error");

  return NextResponse.json(
    {
      error: "Authentication error",
      code: errorCode,
      message: getErrorMessage(errorCode),
    },
    { status: 400 },
  );
}
