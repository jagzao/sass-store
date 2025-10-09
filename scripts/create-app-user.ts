#!/usr/bin/env node
/**
 * Create Application User with RLS Enforcement
 * Creates a non-superuser for the application that respects RLS policies
 */

import { Pool } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function createAppUser() {

  // Use superuser connection for creating users
  const connectionString = process.env.DATABASE_URL_SUPERUSER || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL_SUPERUSER or DATABASE_URL not set');
    process.exit(1);
  }

  // Generate a secure password (hex to avoid URL encoding issues)
  const password = crypto.randomBytes(32).toString('hex');
  const username = 'sass_store_app';

  const pool = new Pool({ connectionString });

  try {
    await pool.query('SELECT NOW()');

    // Check if user already exists
    const userCheck = await pool.query(
      `SELECT 1 FROM pg_user WHERE usename = $1`,
      [username]
    );

    if (userCheck.rows.length > 0) {
    } else {
      // Create user
      await pool.query(`CREATE USER ${username} WITH PASSWORD '${password}'`);
    }

    // Grant connection privileges
    await pool.query(`GRANT CONNECT ON DATABASE postgres TO ${username}`);
    await pool.query(`GRANT USAGE ON SCHEMA public TO ${username}`);

    // Grant table privileges
    await pool.query(`
      GRANT SELECT, INSERT, UPDATE, DELETE
      ON ALL TABLES IN SCHEMA public
      TO ${username}
    `);

    // Grant sequence privileges (for auto-incrementing IDs)
    await pool.query(`
      GRANT USAGE, SELECT
      ON ALL SEQUENCES IN SCHEMA public
      TO ${username}
    `);

    // Set default privileges for future tables
    await pool.query(`
      ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${username}
    `);
    await pool.query(`
      ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT USAGE, SELECT ON SEQUENCES TO ${username}
    `);

    // Verify RLS is enforced for this user
    const rlsCheck = await pool.query(`
      SELECT
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('products', 'services', 'staff', 'bookings', 'orders', 'payments')
      ORDER BY tablename
    `);

    rlsCheck.rows.forEach(row => {
      const status = row.rowsecurity ? '✅ ENFORCED' : '⚠️  NOT ENFORCED';
    });

    const url = new URL(connectionString);
    const newConnectionString = `postgresql://${username}:${password}@${url.host}${url.pathname}`;

  } catch (error) {
    console.error('\n❌ Error creating application user:', error);

    if (error instanceof Error) {
      console.error('\nError Details:', error.message);

      if (error.message.includes('permission denied')) {
      }
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
createAppUser().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
