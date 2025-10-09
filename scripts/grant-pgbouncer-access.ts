#!/usr/bin/env node
/**
 * Grant PgBouncer Access to Application User
 * Supabase poolers require specific role memberships
 */

import { Pool } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function grantPoolerAccess() {
  console.log('🔐 Granting PgBouncer/Pooler Access...\n');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL_SUPERUSER });

  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Connected as superuser\n');

    const username = 'sass_store_app';

    // Grant pgbouncer role (required for Supabase poolers)
    console.log('📝 Granting pgbouncer role...');
    try {
      await pool.query(`GRANT pgbouncer TO ${username}`);
      console.log('   ✅ pgbouncer role granted\n');
    } catch (error: any) {
      if (error.code === '42704') {
        console.log('   ⚠️  pgbouncer role does not exist (may not be needed)\n');
      } else {
        throw error;
      }
    }

    // Grant supabase_admin role
    console.log('📝 Granting supabase_admin role...');
    try {
      await pool.query(`GRANT supabase_admin TO ${username}`);
      console.log('   ✅ supabase_admin role granted\n');
    } catch (error: any) {
      if (error.code === '42704') {
        console.log('   ⚠️  supabase_admin role does not exist\n');
      } else {
        throw error;
      }
    }

    // List all roles
    console.log('📋 Available roles in database:');
    const roles = await pool.query(`
      SELECT rolname FROM pg_roles
      WHERE rolname NOT LIKE 'pg_%'
      ORDER BY rolname
    `);
    roles.rows.forEach(r => console.log(`   - ${r.rolname}`));
    console.log('');

    // Check user's roles
    console.log(`👤 Roles for ${username}:`);
    const userRoles = await pool.query(`
      SELECT r.rolname
      FROM pg_auth_members m
      JOIN pg_roles r ON m.roleid = r.oid
      WHERE m.member = (SELECT oid FROM pg_roles WHERE rolname = $1)
    `, [username]);

    if (userRoles.rows.length === 0) {
      console.log('   No additional roles granted\n');
    } else {
      userRoles.rows.forEach(r => console.log(`   - ${r.rolname}`));
      console.log('');
    }

    console.log('✅ Done!\n');

  } finally {
    await pool.end();
  }
}

grantPoolerAccess();
