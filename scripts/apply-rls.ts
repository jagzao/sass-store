#!/usr/bin/env node
/**
 * Apply RLS (Row Level Security) to Database
 * This script applies the RLS policies to your PostgreSQL database
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SQL_FILE = path.join(__dirname, '..', 'packages', 'database', 'enable-rls.sql');

async function applyRLS() {
  console.log('🔒 Applying Row Level Security (RLS) to Database...\n');
  console.log('════════════════════════════════════════════════════════\n');

  // Check if SQL file exists
  if (!fs.existsSync(SQL_FILE)) {
    console.error('❌ Error: SQL file not found at:', SQL_FILE);
    process.exit(1);
  }

  // Read SQL file
  const sql = fs.readFileSync(SQL_FILE, 'utf-8');
  console.log(`📄 Loaded SQL file: ${SQL_FILE}`);
  console.log(`📊 SQL Size: ${(sql.length / 1024).toFixed(2)} KB\n`);

  // Get database connection string from environment
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable not set');
    console.log('\n💡 Set it in your .env file or run:');
    console.log('   export DATABASE_URL="postgresql://user:pass@host:5432/db"');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  console.log(`   Host: ${new URL(connectionString).host}`);
  console.log(`   Database: ${new URL(connectionString).pathname.slice(1)}\n`);

  const pool = new Pool({
    connectionString,
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database\n');

    console.log('📝 Executing RLS policies...');
    console.log('   This may take a few seconds...\n');

    // Execute SQL
    await pool.query(sql);

    console.log('✅ RLS policies applied successfully!\n');

    // Verify RLS is enabled
    console.log('🔍 Verifying RLS installation...\n');

    const verifyQuery = `
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('products', 'services', 'users', 'appointments', 'staff', 'cart_items', 'orders', 'order_items', 'payments')
      ORDER BY tablename;
    `;

    const result = await pool.query(verifyQuery);

    console.log('RLS Status:');
    console.log('────────────────────────────────');
    for (const row of result.rows) {
      const status = row.rowsecurity ? '✅ ENABLED' : '❌ DISABLED';
      console.log(`  ${row.tablename.padEnd(20)} ${status}`);
    }

    const enabledCount = result.rows.filter(r => r.rowsecurity).length;
    const totalCount = result.rows.length;

    console.log('────────────────────────────────');
    console.log(`Total: ${enabledCount}/${totalCount} tables with RLS\n`);

    if (enabledCount === totalCount) {
      console.log('🎉 SUCCESS! All tables have RLS enabled.\n');
    } else {
      console.log('⚠️  WARNING: Some tables do not have RLS enabled.\n');
    }

    // List policies
    console.log('📋 Installed Policies:');
    console.log('────────────────────────────────');

    const policiesQuery = `
      SELECT schemaname, tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;

    const policies = await pool.query(policiesQuery);
    let currentTable = '';
    for (const policy of policies.rows) {
      if (policy.tablename !== currentTable) {
        console.log(`\n  ${policy.tablename}:`);
        currentTable = policy.tablename;
      }
      console.log(`    - ${policy.policyname}`);
    }

    console.log('\n════════════════════════════════════════════════════════\n');
    console.log('✅ RLS Installation Complete!\n');
    console.log('🎯 Next Steps:\n');
    console.log('1. Test RLS: npx ts-node scripts/test-rls.ts');
    console.log('2. Update code to use RLS helpers');
    console.log('3. Run security scan: npm run security:full');
    console.log('4. Deploy to production\n');

  } catch (error) {
    console.error('\n❌ Error applying RLS:', error);

    if (error instanceof Error) {
      console.error('\nError Details:', error.message);

      if (error.message.includes('already exists')) {
        console.log('\n💡 Tip: RLS policies may already be installed.');
        console.log('   To reinstall, drop policies first:');
        console.log('   DROP POLICY IF EXISTS tenant_isolation_products_select ON products;');
        console.log('   (Repeat for all policies)\n');
      } else if (error.message.includes('permission denied')) {
        console.log('\n💡 Tip: You need SUPERUSER or database owner permissions.');
        console.log('   Try connecting as postgres user or database owner.\n');
      }
    }

    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed\n');
  }
}

// Run
applyRLS().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
