
const postgres = require('../node_modules/postgres');

const connectionString = "postgresql://postgres.jedryjmljffuvegggjmw:TSGmf_3G-rbLbz!@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const sql = postgres(connectionString, {
  ssl: 'require',
  connect_timeout: 10,
});

async function checkUser() {
  try {
    const email = 'marialiciavh1984@gmail.com';
    const tenantSlug = 'wondernails';

    console.log(`Checking for user ${email} in tenant ${tenantSlug}...`);

    // 1. Get Tenant ID
    const tenants = await sql`SELECT id, name FROM tenants WHERE slug = ${tenantSlug}`;
    if (tenants.length === 0) {
      console.log(`Tenant '${tenantSlug}' not found.`);
      return;
    }
    const tenant = tenants[0];
    console.log(`Found tenant: ${tenant.name} (${tenant.id})`);

    // 2. Get User
    const users = await sql`SELECT id, name, email FROM users WHERE email = ${email}`;
    if (users.length === 0) {
        console.log(`User '${email}' not found.`);
        return;
    }
    const user = users[0];
    console.log(`Found user: ${user.name} (${user.id})`);

    // 3. Get Role
    const roles = await sql`SELECT role FROM user_roles WHERE user_id = ${user.id} AND tenant_id = ${tenant.id}`;
    
    if (roles.length === 0) {
        console.log(`User has NO role in this tenant.`);
    } else {
        console.log(`User role in '${tenantSlug}': ${roles[0].role}`);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sql.end();
  }
}

checkUser();
