import { NextRequest, NextResponse } from "next/server";
import { requireDiagnoseAuth } from "@/lib/api/diagnose-auth";

// STRY-021 SEC-009: Guard + eliminados los previews de Client ID
export async function GET(request: NextRequest) {
  const authError = requireDiagnoseAuth(request);
  if (authError) return authError;

  return NextResponse.json({
    env: {
      hasClientId: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      hasRedirectUri: !!process.env.GOOGLE_CALENDAR_REDIRECT_URI,
      hasPublicClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID,
      hasPublicRedirectUri:
        !!process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_REDIRECT_URI,
      // STRY-021 SEC-009: Eliminados clientIdPreview y publicClientIdPreview
      // — exponían los primeros 10 chars de credenciales OAuth
    },
    timestamp: new Date().toISOString(),
  });
}
