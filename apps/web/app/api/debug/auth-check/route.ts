import { NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { users } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const email = "marialiciavh1984@gmail.com";
    const password = "admin";

    // 1. Check DB Connection
    const startTime = Date.now();

    // 2. Find User
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const dbTime = Date.now() - startTime;

    if (!user) {
      return NextResponse.json({
        success: false,
        step: "find_user",
        message: "User not found in DB",
        dbTime,
      });
    }

    if (!user.password) {
      return NextResponse.json({
        success: false,
        step: "check_password_field",
        message: "User has no password set",
        user: { id: user.id, email: user.email },
      });
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Debug: create a new hash to see what it looks like
      const newHash = await bcrypt.hash(password, 10);
      return NextResponse.json({
        success: false,
        step: "verify_password",
        message: "Password mismatch",
        storedHashStart: user.password.substring(0, 10),
        newHashStart: newHash.substring(0, 10),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Auth Check Passed",
      user: { id: user.id, email: user.email },
      dbTime,
    });
  } catch (error) {
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
