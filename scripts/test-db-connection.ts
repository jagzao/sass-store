import postgres from 'postgres';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from apps/web/.env.local
config({ path: path.join(__dirname, '../apps/web/.env.local') });

async function testConnection() {
  console.log('🔍 Probando conexión a Supabase...\n');

  const databaseUrl = process.env.DATABASE_URL;
  console.log('DATABASE_URL:', databaseUrl?.substring(0, 50) + '...');

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no está definida');
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    console.log('\n⏳ Probando query simple...');
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Conexión exitosa!');
    console.log('   Hora del servidor:', result[0].current_time);

    console.log('\n⏳ Probando query de tenants...');
    const tenants = await sql`SELECT id, name, slug FROM tenants LIMIT 3`;
    console.log(`✅ Encontrados ${tenants.length} tenants:`);
    tenants.forEach(t => {
      console.log(`   - ${t.name} (@${t.slug})`);
    });

    console.log('\n⏳ Probando query de products...');
    const products = await sql`
      SELECT p.id, p.name, p.price, t.name as tenant_name
      FROM products p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      LIMIT 5
    `;
    console.log(`✅ Encontrados ${products.length} productos:`);
    products.forEach(p => {
      console.log(`   - ${p.name} ($${p.price}) - ${p.tenant_name}`);
    });

    console.log('\n🎉 ¡Todas las pruebas exitosas!');
    await sql.end();
  } catch (error: any) {
    console.error('\n❌ Error de conexión:', error.message);
    console.error('Stack:', error.stack);
    await sql.end();
    process.exit(1);
  }
}

testConnection();
