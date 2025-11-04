import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../packages/database/schema';

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create connection without pooling for migration
const migrationClient = postgres(DATABASE_URL, { max: 1 });

// Create drizzle instance for migrations
const db = drizzle(migrationClient, { schema });

async function applyRLSPolicies() {
  console.log('Applying Row Level Security policies...');

  try {
    // Enable RLS on all multi-tenant tables
    await db.execute(`
      ALTER TABLE products ENABLE ROW LEVEL SECURITY;
      ALTER TABLE services ENABLE ROW LEVEL SECURITY;
      ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
      ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
      ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    `);

    console.log('✓ RLS enabled on all multi-tenant tables');

    // Create RLS policies for each table
    await db.execute(`
      -- Products table RLS
      DROP POLICY IF EXISTS tenant_isolation_products_select ON products;
      DROP POLICY IF EXISTS tenant_isolation_products_insert ON products;
      DROP POLICY IF EXISTS tenant_isolation_products_update ON products;
      DROP POLICY IF EXISTS tenant_isolation_products_delete ON products;
      
      CREATE POLICY tenant_isolation_products_select ON products
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_products_insert ON products
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_products_update ON products
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_products_delete ON products
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log('✓ RLS policies applied to products table');

    await db.execute(`
      -- Services table RLS
      DROP POLICY IF EXISTS tenant_isolation_services_select ON services;
      DROP POLICY IF EXISTS tenant_isolation_services_insert ON services;
      DROP POLICY IF EXISTS tenant_isolation_services_update ON services;
      DROP POLICY IF EXISTS tenant_isolation_services_delete ON services;
      
      CREATE POLICY tenant_isolation_services_select ON services
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_services_insert ON services
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_services_update ON services
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_services_delete ON services
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log('✓ RLS policies applied to services table');

    await db.execute(`
      -- Staff table RLS
      DROP POLICY IF EXISTS tenant_isolation_staff_select ON staff;
      DROP POLICY IF EXISTS tenant_isolation_staff_insert ON staff;
      DROP POLICY IF EXISTS tenant_isolation_staff_update ON staff;
      DROP POLICY IF EXISTS tenant_isolation_staff_delete ON staff;
      
      CREATE POLICY tenant_isolation_staff_select ON staff
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_staff_insert ON staff
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_staff_update ON staff
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_staff_delete ON staff
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log('✓ RLS policies applied to staff table');

    await db.execute(`
      -- Bookings table RLS
      DROP POLICY IF EXISTS tenant_isolation_bookings_select ON bookings;
      DROP POLICY IF EXISTS tenant_isolation_bookings_insert ON bookings;
      DROP POLICY IF EXISTS tenant_isolation_bookings_update ON bookings;
      DROP POLICY IF EXISTS tenant_isolation_bookings_delete ON bookings;
      
      CREATE POLICY tenant_isolation_bookings_select ON bookings
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_bookings_insert ON bookings
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_bookings_update ON bookings
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_bookings_delete ON bookings
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log('✓ RLS policies applied to bookings table');

    await db.execute(`
      -- Orders table RLS
      DROP POLICY IF EXISTS tenant_isolation_orders_select ON orders;
      DROP POLICY IF EXISTS tenant_isolation_orders_insert ON orders;
      DROP POLICY IF EXISTS tenant_isolation_orders_update ON orders;
      DROP POLICY IF EXISTS tenant_isolation_orders_delete ON orders;
      
      CREATE POLICY tenant_isolation_orders_select ON orders
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_orders_insert ON orders
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_orders_update ON orders
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_orders_delete ON orders
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log('✓ RLS policies applied to orders table');

    await db.execute(`
      -- Payments table RLS
      DROP POLICY IF EXISTS tenant_isolation_payments_select ON payments;
      DROP POLICY IF EXISTS tenant_isolation_payments_insert ON payments;
      DROP POLICY IF EXISTS tenant_isolation_payments_update ON payments;
      DROP POLICY IF EXISTS tenant_isolation_payments_delete ON payments;
      
      CREATE POLICY tenant_isolation_payments_select ON payments
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_payments_insert ON payments
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_payments_update ON payments
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_payments_delete ON payments
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log('✓ RLS policies applied to payments table');

    // Create helper functions
    await db.execute(`
      -- Helper Function: Set Tenant Context
      CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid uuid)
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.current_tenant_id', tenant_uuid::text, FALSE);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Helper Function: Get Current Tenant
      CREATE OR REPLACE FUNCTION get_current_tenant()
      RETURNS uuid AS $$
      BEGIN
        RETURN current_setting('app.current_tenant_id', TRUE)::uuid;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✓ Helper functions created');

    console.log('\n✅ All RLS policies have been successfully applied!');
    console.log('\nIMPORTANT: Make sure to run the database migrations first:');
    console.log('  npm run db:push');
    console.log('\nThen seed your database:');
    console.log('  npm run db:seed');
    console.log('\nThe tenants should be working after these steps.');

  } catch (error) {
    console.error('❌ Error applying RLS policies:', error);
    throw error;
  } finally {
    // Close the connection
    await migrationClient.end();
  }
}

// Run the function if called directly
if (require.main === module) {
  applyRLSPolicies().catch(console.error);
}

export { applyRLSPolicies };