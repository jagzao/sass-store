import { RetouchMonitorService } from "./apps/web/lib/home/retouch-monitor-service";
import { db } from "./apps/web/lib/db";
import { tenants } from "./apps/web/lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const tenant = await db.query.tenants.findFirst({ where: eq(tenants.slug, "wondernails") });
    if (!tenant) throw new Error("Tenant not found");
    
    console.log("Testing with tenant ID:", tenant.id);
    const result = await RetouchMonitorService.getPendingRetouches(tenant.id);
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("FATAL ERROR:", err);
  }
  process.exit(0);
}

run();
