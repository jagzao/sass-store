import { db } from '../packages/database/connection';
import { sql } from 'drizzle-orm';

async function verifyMigration() {
  console.log('🔍 Verificando última migración de la base de datos...\n');

  try {
    // 1. Verificar si las tablas existen
    console.log('1️⃣ Verificando tablas...');
    const tablesQuery = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('campaigns', 'reels')
      ORDER BY table_name;
    `);

    const tables = tablesQuery.rows.map((r: any) => r.table_name);
    console.log('   Tablas encontradas:', tables);

    if (tables.length === 2) {
      console.log('   ✅ Ambas tablas (campaigns, reels) existen\n');
    } else {
      console.log('   ❌ Faltan tablas. Esperadas: [campaigns, reels]\n');
      return;
    }

    // 2. Verificar estructura de la tabla campaigns
    console.log('2️⃣ Verificando estructura de campaigns...');
    const campaignsColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'campaigns'
      ORDER BY ordinal_position;
    `);
    console.log('   Columnas en campaigns:', campaignsColumns.rows.length);
    campaignsColumns.rows.forEach((col: any) => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log('');

    // 3. Verificar estructura de la tabla reels
    console.log('3️⃣ Verificando estructura de reels...');
    const reelsColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reels'
      ORDER BY ordinal_position;
    `);
    console.log('   Columnas en reels:', reelsColumns.rows.length);
    reelsColumns.rows.forEach((col: any) => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log('');

    // 4. Verificar RLS habilitado
    console.log('4️⃣ Verificando Row Level Security (RLS)...');
    const rlsQuery = await db.execute(sql`
      SELECT
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('campaigns', 'reels');
    `);

    rlsQuery.rows.forEach((row: any) => {
      const status = row.rowsecurity ? '✅' : '❌';
      console.log(`   ${status} ${row.tablename}: RLS ${row.rowsecurity ? 'HABILITADO' : 'DESHABILITADO'}`);
    });
    console.log('');

    // 5. Verificar políticas RLS
    console.log('5️⃣ Verificando políticas RLS...');
    const policiesQuery = await db.execute(sql`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN ('campaigns', 'reels')
      ORDER BY tablename, policyname;
    `);

    console.log(`   Total de políticas: ${policiesQuery.rows.length}`);
    const campaignPolicies = policiesQuery.rows.filter((p: any) => p.tablename === 'campaigns');
    const reelPolicies = policiesQuery.rows.filter((p: any) => p.tablename === 'reels');

    console.log(`   - Políticas en campaigns: ${campaignPolicies.length}`);
    campaignPolicies.forEach((p: any) => {
      console.log(`     • ${p.policyname} (${p.cmd}) - roles: ${p.roles}`);
    });

    console.log(`   - Políticas en reels: ${reelPolicies.length}`);
    reelPolicies.forEach((p: any) => {
      console.log(`     • ${p.policyname} (${p.cmd}) - roles: ${p.roles}`);
    });
    console.log('');

    // 6. Verificar índices
    console.log('6️⃣ Verificando índices...');
    const indexesQuery = await db.execute(sql`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('campaigns', 'reels')
      ORDER BY tablename, indexname;
    `);

    console.log(`   Total de índices: ${indexesQuery.rows.length}`);
    const campaignIndexes = indexesQuery.rows.filter((i: any) => i.tablename === 'campaigns');
    const reelIndexes = indexesQuery.rows.filter((i: any) => i.tablename === 'reels');

    console.log(`   - Índices en campaigns: ${campaignIndexes.length}`);
    campaignIndexes.forEach((idx: any) => {
      console.log(`     • ${idx.indexname}`);
    });

    console.log(`   - Índices en reels: ${reelIndexes.length}`);
    reelIndexes.forEach((idx: any) => {
      console.log(`     • ${idx.indexname}`);
    });
    console.log('');

    // 7. Verificar triggers
    console.log('7️⃣ Verificando triggers...');
    const triggersQuery = await db.execute(sql`
      SELECT
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
      AND event_object_table IN ('campaigns', 'reels')
      ORDER BY event_object_table, trigger_name;
    `);

    console.log(`   Total de triggers: ${triggersQuery.rows.length}`);
    triggersQuery.rows.forEach((t: any) => {
      console.log(`   - ${t.trigger_name} en ${t.event_object_table} (${t.action_timing} ${t.event_manipulation})`);
    });
    console.log('');

    // 8. Verificar datos de campaigns (WonderNails)
    console.log('8️⃣ Verificando datos iniciales...');
    const wondernailsId = '3da221b3-d5f8-4c33-996a-b46b68843d99';
    const campaignsData = await db.execute(sql`
      SELECT
        id,
        name,
        type,
        slug,
        lut_file,
        created_at
      FROM campaigns
      WHERE tenant_id = ${wondernailsId}
      ORDER BY name;
    `);

    console.log(`   Campañas para WonderNails: ${campaignsData.rows.length}`);
    if (campaignsData.rows.length > 0) {
      campaignsData.rows.forEach((c: any) => {
        console.log(`   ✅ ${c.name} (${c.type}) - ${c.slug}`);
        console.log(`      LUT: ${c.lut_file || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️  No se encontraron campañas iniciales para WonderNails');
    }
    console.log('');

    // 9. Verificar reels count
    console.log('9️⃣ Verificando reels...');
    const reelsCount = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM reels
      WHERE tenant_id = ${wondernailsId};
    `);
    console.log(`   Total de reels para WonderNails: ${reelsCount.rows[0].total}`);
    console.log('');

    // Resumen final
    console.log('═'.repeat(60));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('═'.repeat(60));

    const allChecks = [
      { name: 'Tablas creadas', passed: tables.length === 2 },
      { name: 'RLS habilitado', passed: rlsQuery.rows.every((r: any) => r.rowsecurity) },
      { name: 'Políticas RLS', passed: policiesQuery.rows.length >= 6 },
      { name: 'Índices creados', passed: indexesQuery.rows.length >= 6 },
      { name: 'Triggers creados', passed: triggersQuery.rows.length >= 2 },
      { name: 'Campañas iniciales', passed: campaignsData.rows.length === 4 }
    ];

    allChecks.forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
    });

    const allPassed = allChecks.every(c => c.passed);
    console.log('═'.repeat(60));

    if (allPassed) {
      console.log('🎉 ¡MIGRACIÓN COMPLETA Y CORRECTA!');
    } else {
      console.log('⚠️  LA MIGRACIÓN ESTÁ INCOMPLETA');
      console.log('\n💡 Ejecuta el archivo APPLY_MIGRATION_NOW.sql en Supabase');
    }
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    throw error;
  }
}

// Ejecutar verificación
verifyMigration()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en verificación:', error);
    process.exit(1);
  });
