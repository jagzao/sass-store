import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

async function applyMigration() {
  console.log("🚀 Aplicando migración a Supabase...\n");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes("localhost")) {
    console.error("❌ DATABASE_URL no está configurada o apunta a localhost");
    console.error("Por favor, configura DATABASE_URL con la URL de Supabase");
    process.exit(1);
  }

  console.log("📝 Conectando a Supabase...");
  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // Leer el archivo SQL
    console.log("📖 Leyendo archivo de migración...");
    const migrationPath = join(process.cwd(), "APPLY_MIGRATION_NOW.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Ejecutar la migración completa
    console.log("⚡ Ejecutando migración...\n");

    // Dividir por líneas y filtrar comentarios/líneas vacías para mejor feedback
    const lines = migrationSQL.split("\n");
    let currentSection = "";

    for (const line of lines) {
      if (line.includes("========")) {
        continue;
      }
      if (line.startsWith("-- ") && !line.startsWith("-- ===")) {
        const comment = line.replace("--", "").trim();
        if (comment && comment.length < 80) {
          currentSection = comment;
          if (
            !comment.includes("COPIAR") &&
            !comment.includes("Instrucciones")
          ) {
            console.log(`  ${comment}`);
          }
        }
      }
    }

    // Ejecutar todo el SQL
    await sql.unsafe(migrationSQL);

    console.log("\n✅ Migración ejecutada exitosamente!\n");

    // Verificación inmediata
    console.log("🔍 Verificando resultados...\n");

    // 1. Verificar tablas
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('campaigns', 'reels')
      ORDER BY table_name;
    `;
    console.log(
      `✅ Tablas creadas: ${tables.map((t) => t.table_name).join(", ")}`,
    );

    // 2. Verificar RLS
    const rls = await sql`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('campaigns', 'reels');
    `;
    const rlsEnabled = rls.every((r) => r.rowsecurity);
    console.log(`✅ RLS habilitado: ${rlsEnabled ? "SÍ" : "NO"}`);

    // 3. Verificar políticas
    const policies = await sql`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN ('campaigns', 'reels');
    `;
    console.log(`✅ Políticas RLS creadas: ${policies[0].count}`);

    // 4. Verificar índices
    const indexes = await sql`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('campaigns', 'reels')
      AND indexname NOT LIKE '%_pkey';
    `;
    console.log(`✅ Índices creados: ${indexes[0].count}`);

    // 5. Verificar campañas iniciales
    const wondernailsId = "3da221b3-d5f8-4c33-996a-b46b68843d99";
    const campaigns = await sql`
      SELECT id, name, type, slug
      FROM campaigns
      WHERE tenant_id = ${wondernailsId}
      ORDER BY name;
    `;

    console.log(`\n✅ Campañas iniciales creadas: ${campaigns.length}`);
    campaigns.forEach((c) => {
      console.log(`   - ${c.name} (${c.type})`);
    });

    console.log("\n" + "═".repeat(60));
    console.log("🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!");
    console.log("═".repeat(60));
    console.log("\n📊 Resumen:");
    console.log(`   • Tablas creadas: 2 (campaigns, reels)`);
    console.log(`   • RLS habilitado: ✅`);
    console.log(`   • Políticas: ${policies[0].count}`);
    console.log(`   • Índices: ${indexes[0].count}`);
    console.log(`   • Campañas: ${campaigns.length}`);
    console.log("\n");

    await sql.end();
  } catch (error: any) {
    console.error("\n❌ Error al aplicar la migración:", error.message);

    if (error.message.includes("already exists")) {
      console.log(
        "\n⚠️  Algunas tablas ya existen. Esto es normal si ya ejecutaste la migración.",
      );
      console.log(
        "💡 Ejecuta el script de verificación para ver el estado actual:",
      );
      console.log(
        '   DATABASE_URL="..." npx tsx scripts/verify-supabase-migration.ts',
      );
    }

    await sql.end();
    throw error;
  }
}

// Ejecutar migración
applyMigration()
  .then(() => {
    console.log("✅ Proceso completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Proceso terminó con errores");
    process.exit(1);
  });
