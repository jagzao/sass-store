require('dotenv').config({path: '.env'});
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() => c.query(`select "customers"."id", "customers"."name", "customers"."phone", "customer_visits"."visit_date" from "customers" inner join "customer_visits" on ("customers"."id" = "customer_visits"."customer_id" and "customer_visits"."status" = 'completed') where ("customers"."tenant_id" = '0aa4afad-e647-49c6-8b08-74d1b4bedea2' and "customers"."status" = 'active') order by "customer_visits"."visit_date" desc`))
  .then(r => console.log('ROWS', r.rows.length))
  .catch(e => console.error('PG ERROR:', e))
  .finally(()=>c.end());
