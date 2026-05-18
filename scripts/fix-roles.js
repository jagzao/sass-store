const { Client } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/sass_store_test";

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  // Update roles from Cliente to Admin
  const res = await client.query(`
    UPDATE user_roles
    SET role = 'Admin', updated_at = NOW()
    WHERE user_id = 'e2e-test-user-001'
      AND role = 'Cliente'
      AND tenant_id IN (
        SELECT id FROM tenants WHERE slug IN ('nom-nom', 'vigistudio')
      )
    RETURNING tenant_id
  `);

  console.log("Updated " + res.rowCount + " rows");

  // Verify all roles
  const verify = await client.query(`
    SELECT t.slug, ur.role
    FROM user_roles ur
    JOIN tenants t ON t.id = ur.tenant_id
    WHERE ur.user_id = 'e2e-test-user-001'
    ORDER BY t.slug
  `);

  console.log("\nRoles actuales:");
  verify.rows.forEach((r) => console.log(r.slug + " | " + r.role));

  await client.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
