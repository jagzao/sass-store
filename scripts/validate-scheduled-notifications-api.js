/**
 * Validates scheduled_notifications table + internal API (enqueue poll cycle).
 */
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "../apps/web/.env.local");
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1);
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

async function main() {
  const env = loadEnvLocal();
  const base = env.NEXTAUTH_URL || env.AUTH_URL || "http://localhost:3001";
  let apiKey = env.SCHEDULED_NOTIFICATIONS_API_KEY;

  if (!apiKey) {
    const crypto = require("crypto");
    apiKey = crypto.randomBytes(32).toString("hex");
    const envPath = path.join(__dirname, "../apps/web/.env.local");
    const append = `\n# Cola n8n (generado ${new Date().toISOString().slice(0, 10)})\nSCHEDULED_NOTIFICATIONS_API_KEY=${apiKey}\n`;
    fs.appendFileSync(envPath, append, "utf8");
    console.log("Added SCHEDULED_NOTIFICATIONS_API_KEY to apps/web/.env.local");
  }

  const headers = { Authorization: `Bearer ${apiKey}` };

  const listRes = await fetch(
    `${base}/api/internal/scheduled-notifications?limit=5`,
    { headers },
  );
  const listText = await listRes.text();
  if (!listRes.ok) {
    console.error("GET failed", listRes.status, listText.slice(0, 500));
    process.exit(1);
  }
  const listJson = JSON.parse(listText);
  console.log("GET OK — pending count:", listJson.meta?.count ?? 0);

  const postgres = require("postgres");
  const db = postgres(env.DATABASE_URL, { max: 1 });
  try {
    const tenants = await db`SELECT id, slug, name FROM tenants LIMIT 1`;
    if (tenants.length === 0) {
      console.warn("No tenants in DB — skip insert test");
      process.exit(0);
    }
    const tenant = tenants[0];
    const [inserted] = await db`
      INSERT INTO scheduled_notifications (
        tenant_id, channel, status, scheduled_at,
        recipient_phone, recipient_name, body, template_key,
        payload, idempotency_key, created_by
      ) VALUES (
        ${tenant.id}, 'whatsapp', 'pending', NOW(),
        '5215550000001', 'Test n8n', 'Mensaje de validación multitenant',
        'validation_ping',
        ${JSON.stringify({ tenantSlug: tenant.slug, test: true })}::jsonb,
        ${"validation_ping_" + Date.now()},
        'migration_script'
      )
      RETURNING id
    `;

    const list2 = await fetch(
      `${base}/api/internal/scheduled-notifications?limit=10`,
      { headers },
    );
    const list2Json = await list2.json();
    const found = (list2Json.data || []).some((r) => r.id === inserted.id);
    if (!found) {
      console.error("Inserted row not returned by GET");
      process.exit(1);
    }

    const patchRes = await fetch(
      `${base}/api/internal/scheduled-notifications/${inserted.id}`,
      {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "processing" }),
      },
    );
    if (!patchRes.ok) {
      console.error("PATCH processing failed", await patchRes.text());
      process.exit(1);
    }

    const patchSent = await fetch(
      `${base}/api/internal/scheduled-notifications/${inserted.id}`,
      {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sent",
          externalMessageId: "wamid.validation.test",
        }),
      },
    );
    if (!patchSent.ok) {
      console.error("PATCH sent failed", await patchSent.text());
      process.exit(1);
    }

    await db`DELETE FROM scheduled_notifications WHERE id = ${inserted.id}`;
    console.log("Full cycle OK for tenant:", tenant.slug);
    console.log("API key configured in .env.local (same key for n8n)");
  } finally {
    await db.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
