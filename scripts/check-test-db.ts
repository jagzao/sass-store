import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { tenants } from '../packages/database/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.test explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const connectionString = process.env.TEST_DATABASE_URL;

if (!connectionString) {
  console.error('TEST_DATABASE_URL is not defined');
  process.exit(1);
}

console.log(`Connecting to TEST database... ${connectionString}`);
const client = postgres(connectionString);
const db = drizzle(client);

async function checkTenant() {
  const slug = process.env.TEST_TENANT_SLUG || 'wondernails';
  console.log(`Checking tenant in TEST DB: ${slug}`);
  
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
