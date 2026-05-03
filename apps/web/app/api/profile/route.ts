import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, users } from "@sass-store/database";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { noCacheJson } from "@/lib/cache-headers";

const GENDER_VALUES = [
  "masculino",
  "femenino",
  "otro",
  "prefiero_no_decir",
] as const;

const updateProfileSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().max(20).optional().nullable(),
  birthdate: z.string().optional().nullable(), // ISO date "YYYY-MM-DD"
  gender: z.enum(GENDER_VALUES).optional().nullable(),
  tenantSlug: z.string(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return noCacheJson({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return noCacheJson(
        { error: "Invalid input", details: result.error.errors },
        { status: 400 },
      );
    }

    const { name, phone, birthdate, gender } = result.data;

    const updateData: Record<string, unknown> = { name, updatedAt: new Date() };
    if (phone !== undefined) updateData.phone = phone;
    if (birthdate !== undefined)
      updateData.birthdate = birthdate ? new Date(birthdate) : null;
    if (gender !== undefined) updateData.gender = gender;

    await db.update(users).set(updateData).where(eq(users.id, session.user.id));

    return noCacheJson({ success: true, name });
  } catch (error) {
    console.error("Error updating profile:", error);
    return noCacheJson({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return noCacheJson({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({
        phone: users.phone,
        birthdate: users.birthdate,
        gender: users.gender,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return noCacheJson({
      phone: user?.phone ?? null,
      birthdate: user?.birthdate ?? null,
      gender: user?.gender ?? null,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return noCacheJson({ error: "Internal Server Error" }, { status: 500 });
  }
}
