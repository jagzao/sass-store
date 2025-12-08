
const postgres = require('postgres');
const dotenv = require('dotenv');
dotenv.config({ override: true });

async function checkTenant() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':****@'));

  const sql = postgres(connectionString);

  try {
    const tenants = await sql`SELECT * FROM tenants WHERE slug = 'wondernails'`;
    console.log('Tenants found:', tenants.length);
    if (tenants.length > 0) {
      console.log('Tenant data:', tenants[0]);
    } else {
      console.log('Tenant "wondernails" NOT FOUND in database.');
      const allTenants = await sql`SELECT slug, name FROM tenants`;
      console.log('Available tenants:', allTenants);
    }
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await sql.end();
  }
}

checkTenant();
