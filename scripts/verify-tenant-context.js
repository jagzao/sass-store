require("dotenv").config();
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(async () => {
  const r = await c.query(
    "SELECT proname FROM pg_proc WHERE proname IN ('set_tenant_context', 'get_tenant_context')",
  );
  console.log("Functions found:", r.rows.map((row) => row.proname).join(", "));
  await c.end();
});
