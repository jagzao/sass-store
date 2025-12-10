const { execSync } = require('child_process');

console.log('🌱 Running post-build seed for production...');

try {
  // Verificar si estamos en entorno de producción
  if (process.env.NODE_ENV !== 'production') {
    console.log('⏭️ Not in production environment, skipping seed...');
    process.exit(0);
  }

  // Verificar si tenemos la URL de la base de datos
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Verificar si tenemos el token de seed
  if (!process.env.VERCEL_SEED_TOKEN) {
    console.log('⏭️  VERCEL_SEED_TOKEN not set, skipping seed...');
    console.log('ℹ️  To enable automatic seeding, set VERCEL_SEED_TOKEN in your environment');
    process.exit(0);
  }

  console.log('🔄 Running database seed...');

  // Ejecutar el seed usando el script existente
  execSync('npx tsx scripts/vercel-seed-production.ts', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  console.log('✅ Post-build seed completed successfully');
} catch (error) {
  console.error('❌ Post-build seed failed:', error.message);
  process.exit(1);
}