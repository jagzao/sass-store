import { db } from "../apps/web/lib/db";
import { readFileSync } from "fs";
import { join } from "path";

async function runRetouchMigration() {
  try {
    console.log("🔄 Ejecutando migración del sistema de fechas de retoque...");

    // Leer el archivo SQL de migración
    const sqlPath = join(__dirname, "retouch-date-migration.sql");
    const sql = readFileSync(sqlPath, "utf8");

    // Ejecutar la migración
    await db.execute(sql);

    console.log("✅ Migración ejecutada correctamente");
    console.log("📊 Tablas creadas:");
    console.log("   - service_retouch_config");
    console.log("   - tenant_holidays");
    console.log("   - Columnas adicionales en customers");
  } catch (error) {
    console.error("❌ Error al ejecutar la migración:", error);
    process.exit(1);
  }
}

runRetouchMigration();
