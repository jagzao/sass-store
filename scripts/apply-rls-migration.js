/**
 * Script to enable RLS on campaigns table
 * Run: node scripts/apply-rls-migration.js
 *
 * This script:
 * 1. Verifies current RLS status on campaigns table
 * 2. Lists existing policies
 * 3. Enables RLS on the campaigns table
 * 4. Verifies the change was applied successfully
 */

require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function applyRLSMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  });

  console.log("\n🔍 RLS Migration for campaigns table\n");
  console.log(
    "DATABASE_URL:",
    process.env.DATABASE_URL || process.env.POSTGRES_URL
      ? "✅ Found"
      : "❌ Not found",
  );
  console.log("\n-----------------------------------\n");

  try {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
      console.error("❌ DATABASE_URL or POSTGRES_URL not found in environment");
      process.exit(1);
    }

    await client.connect();
    console.log("✅ Connected to database\n");

    // Step 1: Check current RLS status
    console.log("📊 Step 1: Checking current RLS status...");
    const rlsStatus = await client.query(`
      SELECT 
        relname AS table_name,
        relrowsecurity AS rls_enabled,
        relforcerowsecurity AS rls_forced
      FROM pg_class 
      WHERE relname = 'campaigns'
    `);

    if (rlsStatus.rows.length === 0) {
      console.error('❌ Table "campaigns" not found');
      process.exit(1);
    }

    const currentStatus = rlsStatus.rows[0];
    console.log("Current status:");
    console.log(`  Table: ${currentStatus.table_name}`);
    console.log(
      `  RLS Enabled: ${currentStatus.rls_enabled ? "✅ Yes" : "❌ No"}`,
    );
    console.log(
      `  RLS Forced: ${currentStatus.rls_forced ? "✅ Yes" : "❌ No"}\n`,
    );

    if (currentStatus.rls_enabled) {
      console.log(
        "✅ RLS is already enabled on campaigns table. Nothing to do.\n",
      );
      await client.end();
      process.exit(0);
    }

    // Step 2: List existing policies
    console.log("📋 Step 2: Listing existing policies...");
    const policies = await client.query(`
      SELECT 
        policyname,
        permissive AS is_permissive,
        roles,
        cmd AS command
      FROM pg_policies
      WHERE tablename = 'campaigns'
      ORDER BY policyname
    `);

    if (policies.rows.length === 0) {
      console.warn("⚠️  No RLS policies found on campaigns table");
      console.warn(
        "⚠️  Enabling RLS without policies will restrict all access\n",
      );
    } else {
      console.log(`Found ${policies.rows.length} policy(ies):`);
      policies.rows.forEach((policy) => {
        console.log(`  - ${policy.policyname}`);
        console.log(`    Command: ${policy.command}`);
        console.log(`    Roles: ${policy.roles || "All"}`);
        console.log(`    Permissive: ${policy.is_permissive ? "Yes" : "No"}\n`);
      });
    }

    // Step 3: Enable RLS
    console.log("🔧 Step 3: Enabling RLS on campaigns table...");
    await client.query(
      "ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY",
    );
    console.log("✅ RLS enabled successfully\n");

    // Step 4: Verify the change
    console.log("✅ Step 4: Verifying RLS is now enabled...");
    const newStatus = await client.query(`
      SELECT 
        relname AS table_name,
        relrowsecurity AS rls_enabled
      FROM pg_class 
      WHERE relname = 'campaigns'
    `);

    if (newStatus.rows[0].rls_enabled) {
      console.log("✅ Verification successful: RLS is now enabled\n");
      console.log("-----------------------------------");
      console.log("✅ Migration completed successfully!\n");
      console.log("Next steps:");
      console.log(
        "1. Test access with anon, authenticated, and service_role roles",
      );
      console.log("2. Verify policies are working as expected");
      console.log("3. Monitor for any access issues in production\n");
    } else {
      console.error("❌ Verification failed: RLS was not enabled");
      process.exit(1);
    }

    await client.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\nFull error:", error);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

applyRLSMigration();
