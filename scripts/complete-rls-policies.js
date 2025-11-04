const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function completeRLS() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🔐 Completing RLS Policies for All Operations...\n');

    const tables = ['products', 'services', 'staff', 'bookings', 'orders', 'order_items', 'payments'];

    for (const table of tables) {
      console.log(`\n📋 ${table}:`);

      // SELECT policy
      try {
        await pool.query(`
          CREATE POLICY ${table}_read_own_tenant ON ${table}
            FOR SELECT
            USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);
        `);
        console.log(`  ✅ SELECT policy created`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ✓  SELECT policy exists`);
        } else {
          console.log(`  ⚠️  SELECT: ${err.message}`);
        }
      }

      // INSERT policy
      try {
        await pool.query(`
          CREATE POLICY ${table}_insert_own_tenant ON ${table}
            FOR INSERT
            WITH CHECK (tenant_id = get_current_tenant_id());
        `);
        console.log(`  ✅ INSERT policy created`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ✓  INSERT policy exists`);
        } else {
          console.log(`  ⚠️  INSERT: ${err.message}`);
        }
      }

      // UPDATE policy
      try {
        await pool.query(`
          CREATE POLICY ${table}_update_own_tenant ON ${table}
            FOR UPDATE
            USING (tenant_id = get_current_tenant_id())
            WITH CHECK (tenant_id = get_current_tenant_id());
        `);
        console.log(`  ✅ UPDATE policy created`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ✓  UPDATE policy exists`);
        } else {
          console.log(`  ⚠️  UPDATE: ${err.message}`);
        }
      }

      // DELETE policy
      try {
        await pool.query(`
          CREATE POLICY ${table}_delete_own_tenant ON ${table}
            FOR DELETE
            USING (tenant_id = get_current_tenant_id());
        `);
        console.log(`  ✅ DELETE policy created`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ✓  DELETE policy exists`);
        } else {
          console.log(`  ⚠️  DELETE: ${err.message}`);
        }
      }
    }

    // List all policies
    console.log('\n\n📊 All RLS Policies:\n');
    const policies = await pool.query(`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);

    let currentTable = '';
    for (const policy of policies.rows) {
      if (policy.tablename !== currentTable) {
        console.log(`\n  ${policy.tablename}:`);
        currentTable = policy.tablename;
      }
      console.log(`    - ${policy.policyname}`);
    }

    console.log('\n\n✅ RLS Policies Complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

completeRLS();
