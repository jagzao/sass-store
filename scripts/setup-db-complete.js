const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function setupDatabase() {
  console.log("🚀 Setting up database with schema + RLS...\n");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  console.log(
    "🔌 Connecting to:",
    connectionString.split("@")[1]?.split(":")[0],
  );

  const pool = new Pool({ connectionString });

  try {
    // Test connection
    await pool.query("SELECT NOW()");
    console.log("✅ Connected\n");

    // Read and execute RLS migration
    console.log("📝 Applying RLS policies...");
    const sqlPath = path.join(
      __dirname,
      "..",
      "packages",
      "database",
      "migrations",
      "add-rls-policies.sql",
    );
    const sql = fs.readFileSync(sqlPath, "utf-8");

    // Split by statements and execute one by one
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    let success = 0;
    let skipped = 0;

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
        success++;
      } catch (err) {
        if (err.message.includes("does not exist")) {
          console.log(
            `⚠️  Table doesn't exist yet: ${stmt.substring(0, 50)}...`,
          );
          skipped++;
        } else if (err.message.includes("already exists")) {
          skipped++;
        } else {
          console.error(`❌ Error: ${err.message}`);
        }
      }
    }

    console.log(`\n✅ Applied: ${success}, Skipped: ${skipped}\n`);

    // Verify RLS
    const result = await pool.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    console.log("📊 RLS Status:");
    result.rows.forEach((r) => {
      const status = r.rowsecurity ? "✅" : "❌";
      console.log(`   ${status} ${r.tablename}`);
    });

    console.log("\n✅ Database setup complete!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
