import { db, tenants } from "@sass-store/database";
import { ilike } from "drizzle-orm";

async function listTenants() {
  const testTenants = await db.query.tenants.findMany({
    where: ilike(tenants.name, "%Test Tenant%"),
  });

  console.log("Found tenants:", testTenants.length);
  testTenants.forEach((t) => console.log(`${t.id} - ${t.name} (${t.slug})`));
  process.exit(0);
}

listTenants().catch(console.error);
