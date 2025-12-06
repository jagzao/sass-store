import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const maskedUrl = dbUrl ? dbUrl.replace(/:[^:]*@/, ":****@") : "UNDEFINED";

  return NextResponse.json({
    databaseUrl: maskedUrl,
    nodeEnv: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL,
  });
}
