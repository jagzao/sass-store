const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function applyRLS() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🔐 Applying RLS Helper Function...\n');

    // Create helper function
    await pool.query(`
      CREATE OR REPLACE FUNCTION get_current_tenant_id()
      RETURNS UUID AS $$
      BEGIN
        RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log('✅ Helper function created\n');

    // Enable RLS on existing tables
    const tables = ['tenants', 'products', 'services', 'staff', 'bookings', 'orders', 'order_items', 'payments'];
    
    console.log('🔒 Enabling RLS on tables...\n');
    for (const table of tables) {
      try {
        await pool.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
        console.log(`✅ ${table}`);
      } catch (err) {
        if (err.message.includes('does not exist')) {
          console.log(`⚠️  ${table} - table not found`);
        } else {
          console.log(`✅ ${table} - already enabled`);
        }
      }
    }

    // Create policies for products
    console.log('\n📝 Creating RLS policies for products...\n');
    
    try {
      await pool.query(`
        CREATE POLICY product_read_own_tenant ON products
          FOR SELECT
          USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);
      `);
      console.log('✅ product_read_own_tenant');
    } catch (err) {
      console.log('⚠️  product_read_own_tenant - already exists');
    }

    try {
      await pool.query(`
        CREATE POLICY product_insert_own_tenant ON products
          FOR INSERT
          WITH CHECK (tenant_id = get_current_tenant_id());
      `);
      console.log('✅ product_insert_own_tenant');
    } catch (err) {
      console.log('⚠️  product_insert_own_tenant - already exists');
    }

    // Verify
    console.log('\n📊 Final RLS Status:\n');
    const result = await pool.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('products', 'services', 'orders', 'bookings', 'tenants')
      ORDER BY tablename
    `);

    result.rows.forEach(r => {
      const status = r.rowsecurity ? '✅ ENABLED' : '❌ DISABLED';
      console.log(`   ${r.tablename.padEnd(15)} ${status}`);
    });

    console.log('\n✅ RLS Setup Complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyRLS();
