
require("dotenv").config({ path: ".env" });
import { db } from "../packages/database";
import { customerVisits, tenants } from "../packages/database/schema";
import { notInArray, sql } from "drizzle-orm";

async function main() {
  console.log("Checking for orphaned customer visits...");

  // Select all valid tenant IDs
  const validTenants = await db.select({ id: tenants.id }).from(tenants);
  const tenantIds = validTenants.map((t) => t.id);

  if (tenantIds.length === 0) {
    console.log("No tenants found! Aborting safety check.");
    return;
  }

  // Delete visits where tenantId is NOT in validTenants
  const result = await db.delete(customerVisits)
    .where(notInArray(customerVisits.tenantId, tenantIds))
    .returning({ id: customerVisits.id });

  console.log(`Deleted ${result.length} orphaned visits.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error cleaning up DB:", err);
  process.exit(1);
});
