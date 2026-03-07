import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { tenants } from '../packages/database/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

console.log(`Connecting to database...`);
const client = postgres(connectionString);
const db = drizzle(client);

async function checkTenant() {
  const slug = process.env.TEST_TENANT_SLUG || 'wondernails';
  console.log(`Checking tenant: ${slug}`);
  
  try {
    const result = await db.select().from(tenants).where(eq(tenants.slug, slug));
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error querying tenant:', error);
  } finally {
    await client.end();
  }
}

checkTenant();
