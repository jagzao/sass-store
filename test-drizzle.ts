import { db } from "./apps/web/lib/db";
import { customers, customerVisits } from "./apps/web/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

async function run() {
  try {
    const latestVisits = await db
      .select({
        customerId: customers.id,
        customerName: customers.name,
        customerPhone: customers.phone,
        visitDate: customerVisits.visitDate,
      })
      .from(customers)
      .innerJoin(
        customerVisits,
        and(
          eq(customers.id, customerVisits.customerId),
          eq(customerVisits.status, "completed")
        )
      )
      .where(
        and(
          eq(customers.tenantId, "0aa4afad-e647-49c6-8b08-74d1b4bedea2"),
          eq(customers.status, "active")
        )
      )
      .orderBy(desc(customerVisits.visitDate));
    console.log("OK", latestVisits.length);
  } catch (err) {
    console.error("DRIZZLE ERR", err);
  }
  process.exit(0);
}
run();
