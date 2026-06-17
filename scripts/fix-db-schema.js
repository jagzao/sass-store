
const postgres = require('./node_modules/postgres');

const connectionString = "postgresql://postgres.jedryjmljffuvegggjmw:TSGmf_3G-rbLbz!@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const sql = postgres(connectionString, { ssl: 'require' });

async function fixSchema() {
  try {
    console.log("Adding missing columns to customers table...");
    
    await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS address text`;
    console.log("Added address column.");
    
    await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS general_notes text`;
    console.log("Added general_notes column.");
    
    console.log("Schema update complete.");
  } catch (error) {
    console.error("Schema update failed:", error);
  } finally {
    await sql.end();
  }
}

fixSchema();
