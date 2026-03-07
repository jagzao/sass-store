import { db } from "./apps/web/lib/db/connection";
import { userRoles, users, tenants } from "./packages/database/src/schema";
import { eq, and } from "drizzle-orm";

async function fixAdminRole() {
  try {
    const adminEmail = "admin@wondernails.com";
    const tenantSlug = "wondernails";

    const [user] = await db.select().from(users).where(eq(users.email, adminEmail));
    if (!user) {
      console.log("Admin user not found.");
      return;
    }

    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug));
    if (!tenant) {
      console.log("Tenant not found.");
      return;
    }

    const updated = await db.update(userRoles)
      .set({ role: "Admin" })
      .where(and(eq(userRoles.userId, user.id), eq(userRoles.tenantId, tenant.id)))
      .returning();

    console.log("Updated role:", updated);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

fixAdminRole();
