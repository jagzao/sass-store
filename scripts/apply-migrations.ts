#!/usr/bin/env node
/**
 * Apply Database Migrations
 * Applies all Drizzle migrations to the database
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const MIGRATIONS_DIR = path.join(__dirname, '..', 'packages', 'database', 'migrations');

async function applyMigrations() {

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    // Test connection
    await pool.query('SELECT NOW()');

    // Get migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql') && f.match(/^\d{4}_/))
      .sort();


    // Apply each migration
    for (const file of files) {

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

      try {
        await pool.query(sql);
      } catch (error: any) {
        // Ignore "already exists" and "does not exist" errors
        const ignoreCodes = ['42P07', '42703', '42P01']; // table exists, column missing, undefined table
        const ignoreMessages = ['already exists', 'does not exist'];

        if (ignoreCodes.includes(error.code) || ignoreMessages.some(msg => error.message?.includes(msg))) {
        } else {
          throw error;
        }
      }
    }


  } catch (error) {
    console.error('\n❌ Error applying migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
applyMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
