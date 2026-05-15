import postgres from "postgres";

async function verifySupabaseMigration() {
  console.log("🔍 Verificando última migración en Supabase...\n");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes("localhost")) {
    console.error("❌ DATABASE_URL no está configurada o apunta a localhost");
    console.error("Por favor, configura DATABASE_URL con la URL de Supabase");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // 1. Verificar si las tablas existen
    console.log("1️⃣ Verificando tablas campaigns y reels...");
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('campaigns', 'reels')
      ORDER BY table_name;
    `;

    console.log(`   Tablas encontradas: ${tables.length}`);
    tables.forEach((t) => console.log(`   - ${t.table_name}`));

    if (tables.length === 2) {
      console.log("   ✅ Ambas tablas (campaigns, reels) existen\n");
    } else {
      console.log("   ❌ Faltan tablas. Esperadas: campaigns, reels\n");
      console.log(
        "   💡 Debes ejecutar el archivo APPLY_MIGRATION_NOW.sql en Supabase",
      );
      await sql.end();
      return;
    }

    // 2. Verificar estructura de la tabla campaigns
    console.log("2️⃣ Verificando estructura de campaigns...");
    const campaignsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'campaigns'
      ORDER BY ordinal_position;
    `;
    console.log(`   Columnas en campaigns: ${campaignsColumns.length}`);
    campaignsColumns.forEach((col) => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log("");

    // 3. Verificar estructura de la tabla reels
    console.log("3️⃣ Verificando estructura de reels...");
    const reelsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reels'
      ORDER BY ordinal_position;
    `;
    console.log(`   Columnas en reels: ${reelsColumns.length}`);
    reelsColumns.forEach((col) => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log("");

    // 4. Verificar RLS habilitado
    console.log("4️⃣ Verificando Row Level Security (RLS)...");
    const rlsStatus = await sql`
      SELECT
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('campaigns', 'reels');
    `;

    rlsStatus.forEach((row) => {
      const status = row.rowsecurity ? "✅" : "❌";
      console.log(
        `   ${status} ${row.tablename}: RLS ${row.rowsecurity ? "HABILITADO" : "DESHABILITADO"}`,
      );
    });
    console.log("");

    // 5. Verificar políticas RLS
    console.log("5️⃣ Verificando políticas RLS...");
    const policies = await sql`
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
    `;

    console.log(`   Total de políticas: ${policies.length}`);
    const campaignPolicies = policies.filter(
      (p) => p.tablename === "campaigns",
    );
    const reelPolicies = policies.filter((p) => p.tablename === "reels");

    console.log(`   - Políticas en campaigns: ${campaignPolicies.length}`);
    campaignPolicies.forEach((p) => {
      console.log(`     • ${p.policyname} (${p.cmd}) - roles: ${p.roles}`);
    });

    console.log(`   - Políticas en reels: ${reelPolicies.length}`);
    reelPolicies.forEach((p) => {
      console.log(`     • ${p.policyname} (${p.cmd}) - roles: ${p.roles}`);
    });
    console.log("");

    // 6. Verificar índices
    console.log("6️⃣ Verificando índices...");
    const indexes = await sql`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('campaigns', 'reels')
      ORDER BY tablename, indexname;
    `;

    console.log(`   Total de índices: ${indexes.length}`);
    const campaignIndexes = indexes.filter((i) => i.tablename === "campaigns");
    const reelIndexes = indexes.filter((i) => i.tablename === "reels");

    console.log(`   - Índices en campaigns: ${campaignIndexes.length}`);
    campaignIndexes.forEach((idx) => {
      console.log(`     • ${idx.indexname}`);
    });

    console.log(`   - Índices en reels: ${reelIndexes.length}`);
    reelIndexes.forEach((idx) => {
      console.log(`     • ${idx.indexname}`);
    });
    console.log("");

    // 7. Verificar triggers
    console.log("7️⃣ Verificando triggers...");
    const triggers = await sql`
      SELECT
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
      AND event_object_table IN ('campaigns', 'reels')
      ORDER BY event_object_table, trigger_name;
    `;

    console.log(`   Total de triggers: ${triggers.length}`);
    triggers.forEach((t) => {
      console.log(
        `   - ${t.trigger_name} en ${t.event_object_table} (${t.action_timing} ${t.event_manipulation})`,
      );
    });
    console.log("");

    // 8. Verificar datos de campaigns (WonderNails)
    console.log("8️⃣ Verificando datos iniciales...");
    const wondernailsId = "3da221b3-d5f8-4c33-996a-b46b68843d99";
    const campaignsData = await sql`
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
    `;

    console.log(`   Campañas para WonderNails: ${campaignsData.length}`);
    if (campaignsData.length > 0) {
      campaignsData.forEach((c) => {
        console.log(`   ✅ ${c.name} (${c.type}) - ${c.slug}`);
        console.log(`      LUT: ${c.lut_file || "N/A"}`);
      });
    } else {
      console.log(
        "   ⚠️  No se encontraron campañas iniciales para WonderNails",
      );
    }
    console.log("");

    // 9. Verificar reels count
    console.log("9️⃣ Verificando reels...");
    const reelsCount = await sql`
      SELECT COUNT(*) as total
      FROM reels
      WHERE tenant_id = ${wondernailsId};
    `;
    console.log(`   Total de reels para WonderNails: ${reelsCount[0].total}`);
    console.log("");

    // Resumen final
    console.log("═".repeat(60));
    console.log("📊 RESUMEN DE VERIFICACIÓN");
    console.log("═".repeat(60));

    const allChecks = [
      { name: "Tablas creadas", passed: tables.length === 2 },
      { name: "RLS habilitado", passed: rlsStatus.every((r) => r.rowsecurity) },
      { name: "Políticas RLS", passed: policies.length >= 6 },
      { name: "Índices creados", passed: indexes.length >= 6 },
      { name: "Triggers creados", passed: triggers.length >= 2 },
      { name: "Campañas iniciales", passed: campaignsData.length === 4 },
    ];

    allChecks.forEach((check) => {
      const icon = check.passed ? "✅" : "❌";
      console.log(`${icon} ${check.name}`);
    });

    const allPassed = allChecks.every((c) => c.passed);
    console.log("═".repeat(60));

    if (allPassed) {
      console.log("🎉 ¡MIGRACIÓN COMPLETA Y CORRECTA!");
    } else {
      console.log("⚠️  LA MIGRACIÓN ESTÁ INCOMPLETA");
      console.log("\n💡 Pasos para completar:");
      console.log(
        "1. Ve a: https://supabase.com/dashboard/project/jedryjmljffuvegggjmw/sql/new",
      );
      console.log("2. Abre el archivo APPLY_MIGRATION_NOW.sql");
      console.log("3. Copia todo el contenido y pégalo en el SQL Editor");
      console.log('4. Haz clic en "Run"');
      console.log("5. Ejecuta este script nuevamente para verificar");
    }
    console.log("═".repeat(60));

    await sql.end();
  } catch (error) {
    console.error("❌ Error durante la verificación:", error);
    await sql.end();
    throw error;
  }
}

// Ejecutar verificación
verifySupabaseMigration()
  .then(() => {
    console.log("\n✅ Verificación completada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error en verificación:", error);
    process.exit(1);
  });
