/**
 * Ensures jagzao@gmail.com / admin exists with Admin role on all active tenants.
 * Usage: node scripts/ensure-jagzao-admin.js
 */
require("dotenv").config({ path: "apps/web/.env.local" });
require("dotenv").config();

const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const ADMIN_EMAIL = "jagzao@gmail.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin";
const ADMIN_NAME = "Admin User";

const ACTIVE_TENANT_SLUGS = [
  "wondernails",
  "centro-tenistico",
  "delirios",
  "manada-juma",
  "zo-system",
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  await client.connect();

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const existing = await client.query(
    "SELECT id, email, password IS NOT NULL AS has_pwd FROM users WHERE email = $1",
    [ADMIN_EMAIL],
  );

  let userId;
  if (existing.rows.length === 0) {
    userId = randomUUID();
    await client.query(
      `INSERT INTO users (id, email, password, name, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())`,
      [userId, ADMIN_EMAIL, hashedPassword, ADMIN_NAME],
    );
    console.log("Created user:", ADMIN_EMAIL);
  } else {
    userId = existing.rows[0].id;
    await client.query(
      `UPDATE users SET password = $1, name = $2, email_verified = COALESCE(email_verified, NOW()), updated_at = NOW()
       WHERE id = $3`,
      [hashedPassword, ADMIN_NAME, userId],
    );
    console.log("Updated admin credentials for:", ADMIN_EMAIL);
  }

  const passwordCheck = await client.query(
    "SELECT password FROM users WHERE id = $1",
    [userId],
  );
  const match = await bcrypt.compare(
    ADMIN_PASSWORD,
    passwordCheck.rows[0].password,
  );
  console.log("Credentials verify:", match ? "OK" : "FAIL");

  for (const slug of ACTIVE_TENANT_SLUGS) {
    const tenantRes = await client.query(
      "SELECT id, name FROM tenants WHERE slug = $1 AND status = 'active'",
      [slug],
    );
    if (tenantRes.rows.length === 0) {
      console.warn("Tenant not found or inactive:", slug);
      continue;
    }
    const tenantId = tenantRes.rows[0].id;

    await client.query(
      `INSERT INTO user_roles (user_id, tenant_id, role, updated_at)
       VALUES ($1, $2, 'Admin', NOW())
       ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'Admin', updated_at = NOW()`,
      [userId, tenantId],
    );
    console.log("Admin role OK:", slug);
  }

  const roles = await client.query(
    `SELECT t.slug, ur.role
     FROM user_roles ur
     JOIN tenants t ON t.id = ur.tenant_id
     WHERE ur.user_id = $1
     ORDER BY t.slug`,
    [userId],
  );
  console.log("\nRoles for", ADMIN_EMAIL + ":");
  roles.rows.forEach((r) => console.log(" -", r.slug, "=>", r.role));

  await client.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
