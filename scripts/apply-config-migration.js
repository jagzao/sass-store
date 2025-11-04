const { Pool } = require("pg");
const fs = require("fs");
require("dotenv").config({ path: "apps/api/.env.local" });

async function applyConfigMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("🔧 Aplicando migración de configuración...\n");

    // Read the migration file
    const migrationSQL = fs.readFileSync(
      "packages/database/migrations/add-tenant-configs-table.sql",
      "utf8"
    );

    // Split into individual statements and execute
    const statements = migrationSQL
      .split(";")
      .filter((stmt) => stmt.trim().length > 0);

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed && !trimmed.startsWith("--")) {
        try {
          await pool.query(trimmed + ";");
          console.log("✅ Statement executed");
        } catch (err) {
          // Ignore errors for already existing objects
          if (
            err.message.includes("already exists") ||
            err.message.includes("does not exist")
          ) {
            console.log("⚠️  Skipped (already exists or table missing)");
          } else {
            console.log("❌ Error:", err.message);
          }
        }
      }
    }

    // Verify the table was created
    console.log("\n📋 Verificando tabla tenant_configs...\n");
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'tenant_configs'
      )
    `);

    if (result.rows[0].exists) {
      console.log("✅ Tabla tenant_configs creada exitosamente");

      // Check RLS
      const rlsResult = await pool.query(`
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'tenant_configs'
      `);

      if (rlsResult.rows[0]?.rowsecurity) {
        console.log("✅ RLS habilitado en tenant_configs");
      } else {
        console.log("❌ RLS no habilitado en tenant_configs");
      }
    } else {
      console.log("❌ Tabla tenant_configs no encontrada");
    }

    console.log("\n✅ Migración de configuración completada!\n");
  } catch (error) {
    console.error("❌ Error general:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyConfigMigration();
