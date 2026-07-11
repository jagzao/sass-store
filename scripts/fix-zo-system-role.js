const dotenv = require("dotenv");
dotenv.config();
const { Client } = require("pg");

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const u = await client.query(
    "SELECT id FROM users WHERE email = 'jagzao@gmail.com'",
  );
  const t = await client.query(
    "SELECT id FROM tenants WHERE slug = 'zo-system'",
  );

  if (!u.rows[0] || !t.rows[0]) {
    console.log("User or tenant not found");
    await client.end();
    return;
  }

  await client.query(
    "INSERT INTO user_roles (user_id, tenant_id, role) VALUES ($1, $2, 'Admin') ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'Admin'",
    [u.rows[0].id, t.rows[0].id],
  );
  console.log("Role Admin inserted for zo-system");

  const roles = await client.query(
    "SELECT t.slug, ur.role FROM user_roles ur JOIN tenants t ON t.id = ur.tenant_id WHERE ur.user_id = $1",
    [u.rows[0].id],
  );
  console.log(
    "All roles:",
    roles.rows.map((r) => r.slug + ":" + r.role),
  );

  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
