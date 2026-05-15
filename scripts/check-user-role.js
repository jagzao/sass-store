require("dotenv").config();
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(async () => {
  const r = await c.query(`
    SELECT u.id, u.email, u.name, ur.role, ur.tenant_id, t.slug as tenant_slug
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN tenants t ON ur.tenant_id = t.id
    WHERE u.email = 'jagzao@gmail.com'
  `);
  console.table(r.rows);
  await c.end();
});
