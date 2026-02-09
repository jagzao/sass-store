
import "dotenv/config";
import { db, tenants, users, userRoles } from "@sass-store/database";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createSalonTest() {
  console.log("Checking if 'salontest' tenant exists...");
  const existingTenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, "salontest"),
  });

  if (existingTenant) {
    console.log("Tenant 'salontest' already exists. ID:", existingTenant.id);
    process.exit(0);
  }

  console.log("Creating 'salontest' tenant...");

  await db.transaction(async (tx) => {
    // 1. Create Tenant
    const [newTenant] = await tx
      .insert(tenants)
      .values({
        name: "SalonTest",
        slug: "salontest",
        mode: "booking",
        status: "active",
        branding: {
          primaryColor: "#000000",
          secondaryColor: "#ffffff",
          logoUrl: "",
        },
        contact: {
          email: "admin@salontest.com",
        },
        location: {},
        quotas: {},
      })
      .returning();

    console.log("Tenant created:", newTenant.id);

    // 2. Create Admin User
    const email = "admin@salontest.com";
    const password = "password123";
    let userId;

    const existingUser = await tx.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
        console.log("User already exists:", existingUser.id);
        userId = existingUser.id;
    } else {
        console.log("Creating new user...");
        const hashedPassword = await bcrypt.hash(password, 10);
        const [newUser] = await tx.insert(users).values({
            id: crypto.randomUUID(),
            email,
            name: "Admin Salon Test",
            password: hashedPassword,
        }).returning();
        userId = newUser.id;
    }

    // 3. Assign Role
    console.log("Assigning Admin role...");
    await tx
      .insert(userRoles)
      .values({
        userId: userId,
        tenantId: newTenant.id,
        role: "Admin",
      })
      .onConflictDoUpdate({
        target: [userRoles.userId, userRoles.tenantId],
        set: { role: "Admin" },
      });

    console.log("Done! Tenant 'SalonTest' created successfully.");
  });

  process.exit(0);
}

createSalonTest().catch((err) => {
  console.error("Error creating tenant:", err);
  process.exit(1);
});
