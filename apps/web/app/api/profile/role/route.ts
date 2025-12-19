import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, userRoles } from "@sass-store/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateRoleSchema = z.object({
  roleId: z.enum(["Admin", "Gerente", "Personal", "Cliente"]),
  tenantId: z.string().uuid(),
  userId: z.string(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = updateRoleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.errors },
        { status: 400 },
      );
    }

    const { roleId, tenantId, userId } = result.data;

    // Security check: Ensure the user is updating their own role
    // OR has admin privileges (future proofing, but for now strict self-update)
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own role" },
        { status: 403 },
      );
    }

    // Check if role exists for this user and tenant
    const existingRole = await db.query.userRoles.findFirst({
      where: and(
        eq(userRoles.userId, userId),
        eq(userRoles.tenantId, tenantId),
      ),
    });

    if (existingRole) {
      // Update existing role
      await db
        .update(userRoles)
        .set({ role: roleId, updatedAt: new Date() })
        .where(eq(userRoles.id, existingRole.id));
    } else {
      // Create new role assignment
      await db.insert(userRoles).values({
        userId,
        tenantId,
        role: roleId,
      });
    }

    return NextResponse.json({ success: true, role: roleId });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
