import { NextResponse } from "next/server";
import { seedTenantData } from "@/lib/db/seed-data";
import { db } from "@/lib/db/connection";
import { users } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await seedTenantData();

    // Create default user if not exists
    const email = "marialiciavh1984@gmail.com";
    const password = "admin"; // Using simple password for now
    const hashedPassword = await bcrypt.hash(password, 10);

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existingUser) {
      await db.insert(users).values({
        id: crypto.randomUUID(),
        name: "Marialicia Villafuerte",
        email,
        password: hashedPassword,
        emailVerified: new Date(),
      });
      console.log(`✅ Created default user: ${email}`);
    } else {
       // Update password to ensure it matches
       await db.update(users).set({ password: hashedPassword }).where(eq(users.email, email));
       console.log(`✅ Updated password for user: ${email}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database seeded successfully. User created/updated.", 
      result,
      user: { email, password }
    });
  } catch (error) {
    console.error("Seeding failed:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
