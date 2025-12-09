import { db } from '../packages/database/connection';
import { seedTenantData } from '../apps/web/lib/db/seed-data';

async function main() {
  console.log('🌱 Seeding production database...');
  
  try {
    // Verificar si ya hay datos en la base de datos
    const { tenants } = await import('../packages/database/schema');
    const existingTenants = await db.select().from(tenants);
    
    if (existingTenants.length > 0) {
      console.log(`✅ Found ${existingTenants.length} existing tenants, skipping seed...`);
      console.log('ℹ️  If you want to reseed the database, please do it manually.');
      return { success: true, message: 'Database already seeded' };
    }
    
    // Si no hay datos, ejecutar el seed
    const result = await seedTenantData();
    console.log(`✅ Production database seeded successfully!`);
    console.log(`📊 Seeded ${result.tenantCount} tenants`);
    
    return { success: true, tenantCount: result.tenantCount };
  } catch (error) {
    console.error('❌ Production seed failed:', error);
    throw error;
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main()
    .then((result) => {
      console.log('🎉 Production seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Production seeding failed:', error);
      process.exit(1);
    });
}

export { main as seedProductionDatabase };