
const postgres = require('./node_modules/postgres');

const connectionString = "postgresql://postgres.jedryjmljffuvegggjmw:TSGmf_3G-rbLbz!@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const sql = postgres(connectionString, { ssl: 'require' });

async function fixSchema() {
  try {
    console.log("Adding missing columns to services table...");
    
    await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS before_image text`;
    console.log("Added before_image column.");
    
    await sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS after_image text`;
    console.log("Added after_image column.");
    
    console.log("Schema update complete.");
  } catch (error) {
    console.error("Schema update failed:", error);
  } finally {
    await sql.end();
  }
}

fixSchema();
