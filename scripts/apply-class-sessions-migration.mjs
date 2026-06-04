/**
 * Applies packages/database/migrations/0018_class_sessions.sql via postgres.js
 * Usage: node scripts/apply-class-sessions-migration.mjs
 * Requires DATABASE_URL in env or apps/web/.env.local
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(root, "apps", "web", ".env.local");
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^DATABASE_URL=(.+)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

const url = loadDatabaseUrl();
if (!url) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const sqlFile = path.join(
  root,
  "packages/database/migrations/0018_class_sessions.sql",
);
const migrationSql = fs.readFileSync(sqlFile, "utf8");

const db = postgres(url, { max: 1 });

try {
  await db.unsafe(migrationSql);
  console.log("Migration 0018_class_sessions applied successfully");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await db.end({ timeout: 5 });
}
