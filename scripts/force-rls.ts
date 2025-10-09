#!/usr/bin/env node
/**
 * Force RLS for Owner
 * Makes RLS apply even to table owners (including postgres user)
 */

import { Pool } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function forceRLS() {
  console.log('🔒 Forcing RLS for All Users (including owner)...\n');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL_SUPERUSER });

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Connected\n');

    const tables = ['products', 'services', 'staff', 'bookings', 'orders', 'payments'];

    console.log('📝 Applying FORCE ROW LEVEL SECURITY...\n');

    for (const table of tables) {
      console.log(`   ${table}...`);
      await pool.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
    }

    console.log('\n✅ RLS now enforced for ALL users (including owner)\n');

    // Verify
    const verify = await pool.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = ANY($1)
      ORDER BY tablename
    `, [tables]);

    console.log('📋 Verification:\n');
    verify.rows.forEach(row => {
      const status = row.rowsecurity ? '✅ FORCED' : '❌ NOT FORCED';
      console.log(`   ${row.tablename.padEnd(20)} ${status}`);
    });

    console.log('\n💡 Now you can use the postgres user and RLS will still apply!\n');

  } finally {
    await pool.end();
  }
}

forceRLS();
