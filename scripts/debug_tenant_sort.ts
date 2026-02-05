import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { desc, sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    console.log("Attempting query with sort...");
    const results = await db.query.tenants.findMany({
      limit: 5,
      orderBy: (fields, { desc, asc }) => [
        desc(sql`${fields.status} = 'active'`),
        desc(fields.createdAt),
      ],
    });
    console.log("Query successful!");
    console.table(results.map((t) => ({ slug: t.slug, status: t.status })));
  } catch (error) {
    console.error("Query failed:", error);
  }
}

main().catch(console.error);
