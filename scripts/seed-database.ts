import { seedTenantData } from '../apps/web/lib/db/seed-data';

async function main() {
  console.log('🌱 Seeding database...\n');

  try {
    const result = await seedTenantData();
    console.log(`\n✅ Success! Seeded ${result.tenantCount} tenants`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

main();
