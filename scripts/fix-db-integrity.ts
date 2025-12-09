
require("dotenv").config({ path: ".env" });
import { db } from "../packages/database";
import { customerVisits, tenants } from "../packages/database/schema";
import { notInArray, sql } from "drizzle-orm";

async function main() {
  console.log("Checking for orphaned customer visits...");


  // Select all valid tenant IDs
  const validTenants = await db.select({ id: tenants.id }).from(tenants);
  const tenantIds = validTenants.map((t) => t.id);

  console.log(`Found ${tenantIds.length} valid tenants.`);

  // If no tenants, ALL visits are orphaned. 
  // If tenants exist, only visits with invalid tenantId are orphaned.
  
  let result;
  
  if (tenantIds.length === 0) {
      console.log("No tenants found. Deleting ALL customer visits as they are all orphaned...");
      result = await db.delete(customerVisits).returning({ id: customerVisits.id });
  } else {
      console.log("Deleting orphaned visits...");
      result = await db.delete(customerVisits)
        .where(notInArray(customerVisits.tenantId, tenantIds))
        .returning({ id: customerVisits.id });
  }

  console.log(`Deleted ${result.length} orphaned visits.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error cleaning up DB:", err);
  process.exit(1);
});
