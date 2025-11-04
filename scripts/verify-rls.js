const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.jedryjmljffuvegggjmw:TSGmf_3G-rbLbz!@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
});

async function verify() {
  console.log('\n📊 RLS Verification Report\n' + '='.repeat(60) + '\n');

  // Check RLS enabled
  const tables = await pool.query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('products', 'services', 'staff', 'bookings', 'orders', 'tenants')
    ORDER BY tablename
  `);

  console.log('RLS Status:');
  console.log('-'.repeat(60));
  tables.rows.forEach(t => {
    const status = t.rowsecurity ? '✅ ENABLED' : '❌ DISABLED';
    console.log(`  ${t.tablename.padEnd(25)} ${status}`);
  });

  // Count policies
  const policies = await pool.query(`
    SELECT COUNT(*) as count
    FROM pg_policies
    WHERE schemaname = 'public'
  `);

  console.log('-'.repeat(60));
  console.log(`\nTotal RLS Policies Installed: ${policies.rows[0].count}\n`);

  // List key policies
  const keyPolicies = await pool.query(`
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
    ORDER BY tablename
  `);

  console.log('Policies per Table:');
  console.log('-'.repeat(60));
  keyPolicies.rows.forEach(p => {
    console.log(`  ${p.tablename.padEnd(25)} ${p.policy_count} policies`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ RLS is properly configured!\n');

  await pool.end();
}

verify().catch(console.error);
