
// Simple script to test DB connection
// Usage: node test-db-connection.js

const postgres = require('./node_modules/postgres'); // Try root node_modules
// If that fails, we might need to find where postgres is installed. 
// Since it's a monorepo, it might be in node_modules or packages/database/node_modules

const connectionString = "postgresql://postgres.jedryjmljffuvegggjmw:TSGmf_3G-rbLbz!@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

console.log("Testing connection to:", connectionString.replace(/:[^:]*@/, ':****@'));

const sql = postgres(connectionString, {
  ssl: 'require',
  connect_timeout: 10,
});

async function test() {
  try {
    console.log("Connecting...");
    const result = await sql`SELECT 1 as result`;
    console.log("Connection successful!", result);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await sql.end();
  }
}

test();
