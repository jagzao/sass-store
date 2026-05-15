#!/usr/bin/env node
/**
 * Fix RLS Policies - Remove old policies with IS NULL bypass
 * and force RLS for table owners
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

import { db } from "../packages/database";
import { sql } from "drizzle-orm";

async function fixRLSPolicies() {
  console.log("🔧 Fixing RLS Policies\n");
  console.log("════════════════════════════════════════════════════════\n");

  try {
    // 1. Drop old policies with IS NULL bypass
    console.log("📝 Step 1: Dropping old policies with IS NULL bypass...\n");

    const tables = [
      "products",
      "services",
      "staff",
      "bookings",
      "orders",
      "payments",
      "product_reviews",
    ];

    for (const table of tables) {
      // Get all policies for this table
      const policies: any = await db.execute(sql`
        SELECT policyname
        FROM pg_policies
        WHERE tablename = ${table}
      `);

      console.log(`\n  Table: ${table}`);
      console.log(`  Found ${policies.length} policies`);

      // Drop policies that start with 'products_' or 'services_' etc (old naming)
      for (const policy of policies) {
        const policyName = policy.policyname;

        // Drop old policies (they have IS NULL bypass)
        if (policyName.startsWith(`${table}_`)) {
          console.log(`  ❌ Dropping old policy: ${policyName}`);
          await db.execute(
            sql.raw(`DROP POLICY IF EXISTS ${policyName} ON ${table}`),
          );
        } else {
          console.log(`  ✅ Keeping policy: ${policyName}`);
        }
      }
    }

    // 2. Force RLS for table owners
    console.log("\n\n📝 Step 2: Forcing RLS for table owners...\n");

    for (const table of tables) {
      console.log(`  Forcing RLS on: ${table}`);
      await db.execute(
        sql.raw(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`),
      );
    }

    console.log("\n\n✅ RLS Policies Fixed!\n");

    // 3. Verify
    console.log("📝 Step 3: Verifying...\n");

    for (const table of tables) {
      const policies: any = await db.execute(sql`
        SELECT policyname
        FROM pg_policies
        WHERE tablename = ${table}
      `);

      console.log(`  ${table}: ${policies.length} policies`);
      policies.forEach((p: any) => console.log(`    - ${p.policyname}`));
    }

    console.log("\n════════════════════════════════════════════════════════\n");
    console.log("🎉 RLS Fix Complete!\n");
  } catch (error) {
    console.error("\n❌ Error fixing RLS:", error);
    throw error;
  }
}

fixRLSPolicies()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
