/**
 * DB-only validation for scheduled_notifications (no HTTP server required).
 */
const fs = require("fs");
const path = require("path");
const postgres = require("postgres");

function loadEnv() {
  const envPath = path.join(__dirname, "../apps/web/.env.local");
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    out[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, "");
  }
  return out;
}

async function main() {
  const env = loadEnv();
  if (!env.DATABASE_URL) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }

  const db = postgres(env.DATABASE_URL, { max: 1 });
  try {
    const [table] = await db`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'scheduled_notifications'
      ) AS ok
    `;
    if (!table.ok) {
      console.error("Table missing");
      process.exit(1);
    }

    const tenants = await db`SELECT id, slug, name FROM tenants ORDER BY slug LIMIT 5`;
    console.log("Tenants sample:", tenants.map((t) => t.slug).join(", ") || "(none)");

    if (tenants.length === 0) {
      console.log("DB structure OK (no tenants to test insert)");
      process.exit(0);
    }

    const tenant = tenants.find((t) => t.slug === "wondernails") || tenants[0];
    const idem = `db_validation_${Date.now()}`;
    const [row] = await db`
      INSERT INTO scheduled_notifications (
        tenant_id, channel, status, scheduled_at,
        recipient_phone, recipient_name, body, template_key,
        payload, idempotency_key, created_by
      ) VALUES (
        ${tenant.id}, 'whatsapp', 'pending', NOW(),
        '5215550000001', 'Test', 'Validación multitenant',
        'validation_ping',
        ${JSON.stringify({ tenantSlug: tenant.slug })}::jsonb,
        ${idem},
        'validate_script'
      )
      RETURNING id, tenant_id, status, template_key
    `;

    const pending = await db`
      SELECT id, tenant_id, template_key, recipient_name
      FROM scheduled_notifications
      WHERE status = 'pending' AND scheduled_at <= NOW()
      ORDER BY scheduled_at ASC
      LIMIT 5
    `;

    await db`
      UPDATE scheduled_notifications
      SET status = 'sent', sent_at = NOW(), updated_at = NOW()
      WHERE id = ${row.id}
    `;

    await db`DELETE FROM scheduled_notifications WHERE id = ${row.id}`;

    console.log("Insert/update/delete OK for tenant:", tenant.slug);
    console.log("Pending poll query returned:", pending.length, "rows");
    console.log(
      "API key in .env.local:",
      env.SCHEDULED_NOTIFICATIONS_API_KEY ? "yes (use same in n8n)" : "no",
    );
  } finally {
    await db.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
