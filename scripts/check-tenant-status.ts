import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const allTenants = await db
    .select({
      name: tenants.name,
      slug: tenants.slug,
      status: tenants.status,
      createdAt: tenants.createdAt,
    })
    .from(tenants);

  console.log("Tenants found:", allTenants.length);
  console.table(allTenants);
}

main().catch(console.error);
