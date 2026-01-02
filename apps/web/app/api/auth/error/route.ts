import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Return a simple response to avoid timeout
  return NextResponse.json(
    {
      error: "Authentication error",
      message: "Please check your credentials and try again",
    },
    { status: 400 },
  );
}

export async function POST() {
  // Return a simple response to avoid timeout
  return NextResponse.json(
    {
      error: "Authentication error",
      message: "Please check your credentials and try again",
    },
    { status: 400 },
  );
}
