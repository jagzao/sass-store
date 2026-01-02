import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { users } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");
  const password = searchParams.get("password");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json({
        exists: false,
        message: "User not found in database",
      });
    }

    let passwordMatch = false;
    if (password && user.password) {
      passwordMatch = await bcrypt.compare(password, user.password);
    }

    return NextResponse.json({
      exists: true,
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      passwordValid: password ? passwordMatch : "not_tested",
      role: "unknown_checked_only_users_table",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Database error",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 },
    );
  }
}
