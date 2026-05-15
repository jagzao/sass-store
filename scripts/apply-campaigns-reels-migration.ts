// @ts-nocheck
/**
 * Migration Script: Add Campaigns and Reels Tables
 *
 * This script applies the campaigns and reels migration to the database
 * with proper error handling and verification.
 */

import { db } from "@sass-store/database/connection";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function applyMigration() {
  console.log("🚀 Starting Campaigns & Reels Migration...\n");

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "../packages/database/migrations/add-campaigns-reels-tables.sql",
    );

    console.log(`📖 Reading migration file: ${migrationPath}`);
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute the migration
    console.log("⚙️  Executing migration...\n");
    await db.execute(sql.raw(migrationSQL));

    console.log("✅ Migration completed successfully!\n");

    // Verify campaigns were created
    console.log("🔍 Verifying campaigns for WonderNails...");
    const campaigns = await db.execute(sql`
      SELECT id, name, type, slug, lut_file
      FROM campaigns
      WHERE tenant_id = '3da221b3-d5f8-4c33-996a-b46b68843d99'
      ORDER BY name
    `);

    if (campaigns.rows.length > 0) {
      console.log(`✅ Found ${campaigns.rows.length} campaigns:`);
      campaigns.rows.forEach((campaign: any) => {
        console.log(`   - ${campaign.name} (${campaign.type})`);
      });
    } else {
      console.log("⚠️  No campaigns found for WonderNails");
    }

    console.log("\n✨ Migration applied successfully!");
    console.log("\n📋 Next steps:");
    console.log("   1. Verify the campaigns in Supabase dashboard");
    console.log("   2. Test creating a reel via API");
    console.log("   3. Verify RLS policies are working correctly");
  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log("\n✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
