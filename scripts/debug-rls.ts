#!/usr/bin/env node
import { Pool } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function debugRLS() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Get a tenant
    const tenants = await pool.query('SELECT id, name FROM tenants LIMIT 1');
    const tenant = tenants.rows[0];


    // Set tenant context
    await pool.query(`SELECT set_tenant_context($1)`, [tenant.id]);

    // Verify context
    const contextResult = await pool.query(`SELECT current_setting('app.current_tenant_id', TRUE) as tenant_id`);

    // Query without RLS bypass
    const products = await pool.query(`SELECT id, tenant_id, name FROM products LIMIT 5`);
    products.rows.forEach(p => {
      const match = p.tenant_id === tenant.id ? '✅' : '❌';
    });

    // Check if user has bypass
    const roleCheck = await pool.query(`SELECT current_user, pg_has_role(current_user, 'pg_read_all_data', 'member') as can_bypass`);

  } finally {
    await pool.end();
  }
}

debugRLS();
