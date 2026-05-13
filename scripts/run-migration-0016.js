/**
 * Run migration 0016 directly against the database.
 * Uses the existing DATABASE_URL from environment.
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function main() {
  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not found in environment");
    process.exit(1);
  }

  const sqlPath = path.join(
    __dirname,
    "..",
    "packages",
    "database",
    "migrations",
    "0016_add_set_tenant_context_function.sql",
  );
  const sql = fs.readFileSync(sqlPath, "utf-8");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(sql);
    console.log("✅ Migration 0016 applied successfully");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
