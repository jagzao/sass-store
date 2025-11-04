const { Pool } = require("pg");
const fs = require("fs");
require("dotenv").config({ path: "apps/api/.env.local" });

async function applyFullRLS() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("🔐 Applying Full RLS Migration...\n");

    // Read the migration file
    const migrationSQL = fs.readFileSync(
      "packages/database/migrations/add-rls-policies.sql",
      "utf8"
    );

    // Split into individual statements and execute
    const statements = migrationSQL
      .split(";")
      .filter((stmt) => stmt.trim().length > 0);

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed && !trimmed.startsWith("--")) {
        try {
          await pool.query(trimmed + ";");
          console.log("✅ Statement executed");
        } catch (err) {
          // Ignore errors for already existing objects
          if (
            err.message.includes("already exists") ||
            err.message.includes("does not exist")
          ) {
            console.log("⚠️  Skipped (already exists or table missing)");
          } else {
            console.log("❌ Error:", err.message);
          }
        }
      }
    }

    // Verify final status
    console.log("\n📊 Final RLS Status:\n");
    const result = await pool.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    result.rows.forEach((r) => {
      const status = r.rowsecurity ? "✅ ENABLED" : "❌ DISABLED";
      console.log(`   ${r.tablename.padEnd(20)} ${status}`);
    });

    console.log("\n✅ Full RLS Migration Complete!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyFullRLS();
