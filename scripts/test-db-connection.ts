
import { db } from "@sass-store/database";
import { financialMovements, tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Testing DB Connection...");
  try {
    const tenantSlug = "manada-juma";
    console.log(`Fetching tenant: ${tenantSlug}`);
    const tenantResult = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
    
    if (!tenantResult.length) {
      console.error("Tenant not found!");
      return;
    }
    const tenantId = tenantResult[0].id;
    console.log(`Tenant ID: ${tenantId}`);

    console.log("Fetching movements...");
    const movements = await db.select().from(financialMovements).where(eq(financialMovements.tenantId, tenantId)).limit(5);
    console.log("Movements fetched:", movements);
  } catch (error) {
    console.error("DB Error:", error);
  }
}

main();
