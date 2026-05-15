require("dotenv").config();
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(async () => {
  const r = await c.query(
    "SELECT proname, prosrc FROM pg_proc WHERE proname LIKE '%tenant_context%'",
  );
  console.table(r.rows);
  await c.end();
});
