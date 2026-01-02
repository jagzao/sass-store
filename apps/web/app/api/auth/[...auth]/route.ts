import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  console.log("Debug: [...auth] GET handler hit", request.url);
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  console.log("Debug: [...auth] POST handler hit", request.url);
  return handlers.POST(request);
}
