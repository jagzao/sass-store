
const postgres = require('./node_modules/postgres');

const connectionString = "postgresql://postgres.jedryjmljffuvegggjmw:TSGmf_3G-rbLbz!@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const sql = postgres(connectionString, { ssl: 'require' });

async function checkSchema() {
  try {
    console.log("Checking columns of customer_visits table...");
    
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customer_visits'
    `;
    
    console.log(columns);
  } catch (error) {
    console.error("Check failed:", error);
  } finally {
    await sql.end();
  }
}

checkSchema();
