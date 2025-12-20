import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    env: {
      hasClientId: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      hasRedirectUri: !!process.env.GOOGLE_CALENDAR_REDIRECT_URI,
      hasPublicClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID,
      hasPublicRedirectUri:
        !!process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_REDIRECT_URI,
      clientIdPreview: process.env.GOOGLE_CALENDAR_CLIENT_ID?.substring(0, 10),
      publicClientIdPreview:
        process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID?.substring(0, 10),
    },
    timestamp: new Date().toISOString(),
  });
}
