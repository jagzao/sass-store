/**
 * Applies 0017_scheduled_notifications.sql using DATABASE_URL from apps/web/.env.local
 */
const fs = require("fs");
const path = require("path");
const postgres = require("postgres");

const envPath = path.join(__dirname, "../apps/web/.env.local");
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL=")) {
      databaseUrl = trimmed.slice("DATABASE_URL=".length).replace(/^["']|["']$/g, "");
      break;
    }
  }
}

if (!databaseUrl) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const sqlPath = path.join(
  __dirname,
  "../packages/database/migrations/0017_scheduled_notifications.sql",
);
const sql = fs.readFileSync(sqlPath, "utf8");

async function main() {
  const sqlClient = postgres(databaseUrl, { max: 1 });
  try {
    await sqlClient.unsafe(sql);
    const [table] = await sqlClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'scheduled_notifications'
      ) AS exists
    `;
  const [colCount] = await sqlClient`
      SELECT count(*)::int AS n
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'scheduled_notifications'
    `;
    console.log("Migration 0017 OK");
    console.log("Table exists:", table.exists);
    console.log("Column count:", colCount.n);
    process.exit(table.exists && colCount.n >= 20 ? 0 : 1);
  } finally {
    await sqlClient.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
