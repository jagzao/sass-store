
import { FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  // Determine the path to the .env.local file based on the project root
  const envPath = path.resolve(config.rootDir, '.env.local');

  // Load the environment variables from .env.local
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn(`Could not load .env.local file from ${envPath}.`);
  } else {
    console.log(`Loaded environment variables from ${envPath}.`);
  }

  // The correct DATABASE_URL from the file
  const correctDatabaseUrl = result.parsed?.DATABASE_URL;

  if (correctDatabaseUrl) {
    // Check if the environment variable is already set and if it's the incorrect one
    const currentDbUrl = process.env.DATABASE_URL;
    if (currentDbUrl && currentDbUrl.includes('db.jedryjmljffuvegggjmw.supabase.co')) {
      console.log('Overriding incorrect DATABASE_URL with the one from .env.local');
      process.env.DATABASE_URL = correctDatabaseUrl;
    }
     else if (!currentDbUrl) {
      console.log('DATABASE_URL not set, setting it from .env.local');
      process.env.DATABASE_URL = correctDatabaseUrl;
    }
    console.log('Playwright global setup: DATABASE_URL is now set.');
  } else {
    console.warn('DATABASE_URL not found in .env.local file.');
  }
}

export default globalSetup;
