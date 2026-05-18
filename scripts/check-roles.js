const { Client } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/sass_store_test";

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  // Verificar roles actuales
  const roles = await client.query(`
    SELECT t.slug, t.name, u.id as user_id, ur.role
    FROM tenants t
    LEFT JOIN user_roles ur ON ur.tenant_id = t.id
    LEFT JOIN users u ON u.id = ur.user_id
    WHERE t.status = 'active' AND u.email = 'jagzao@gmail.com'
    ORDER BY t.slug
  `);

  if (roles.rows.length === 0) {
    console.log("NO TIENE ROLES EN NINGUN TENANT");
  } else {
    roles.rows.forEach((r) =>
      console.log(r.slug + " | " + r.role + " | user: " + r.user_id),
    );
  }

  // Listar tenants donde NO tiene rol
  const sinRol = await client.query(`
    SELECT t.slug, t.name
    FROM tenants t
    WHERE t.status = 'active'
      AND t.id NOT IN (
        SELECT ur.tenant_id FROM user_roles ur
        JOIN users u ON u.id = ur.user_id
        WHERE u.email = 'jagzao@gmail.com'
      )
    ORDER BY t.slug
  `);

  if (sinRol.rows.length > 0) {
    console.log("\nSIN ROL:");
    sinRol.rows.forEach((r) => console.log(r.slug + " | " + r.name));
  } else {
    console.log("\nTIENE ROL EN TODOS LOS TENANTS");
  }

  await client.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
