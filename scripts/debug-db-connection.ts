
import * as dotenv from 'dotenv';
import { Client } from 'pg';

// Load environment variables from .env.local or .env
dotenv.config({ path: '.env.local' });
dotenv.config();

async function testDatabaseConnection() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable not found.');
    console.error('Please ensure a .env.local or .env file with the DATABASE_URL is present.');
    return;
  }

  console.log('Attempting to connect to the database...');
  console.log(`(Hostname: ${new URL(connectionString).hostname})`);

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false, // Supabase requires SSL, but this helps with some connection issues.
    },
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful!');
    
    // Optional: Run a simple query
    const res = await client.query('SELECT NOW()');
    console.log('🕒 Current time from DB:', res.rows[0].now);

  } catch (error) {
    console.error('❌ Database connection failed:');
    if (error instanceof Error) {
      console.error(`[${error.name}] ${error.message}`);
      // Log the full error object for more details, e.g., stack trace
      console.error(error);
    } else {
      console.error('An unknown error occurred:', error);
    }
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

testDatabaseConnection();
