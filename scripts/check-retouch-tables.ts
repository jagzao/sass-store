import { db } from "../apps/web/lib/db";
import { sql } from "drizzle-orm";

async function checkRetouchTables() {
  try {
    console.log("🔍 Verificando tablas del sistema de fechas de retoque...");

    // Verificar tabla tenant_holidays
    try {
      const holidays = await db.execute(
        sql`SELECT 1 FROM tenant_holidays LIMIT 1`,
      );
      console.log("✅ Tabla tenant_holidays existe");
    } catch (error) {
      console.log("❌ Tabla tenant_holidays no existe:", error.message);
    }

    // Verificar tabla service_retouch_config
    try {
      const configs = await db.execute(
        sql`SELECT 1 FROM service_retouch_config LIMIT 1`,
      );
      console.log("✅ Tabla service_retouch_config existe");
    } catch (error) {
      console.log("❌ Tabla service_retouch_config no existe:", error.message);
    }

    // Verificar columna next_retouch_date en customers
    try {
      const customers = await db.execute(
        sql`SELECT next_retouch_date FROM customers LIMIT 1`,
      );
      console.log("✅ Columna next_retouch_date existe en customers");
    } catch (error) {
      console.log(
        "❌ Columna next_retouch_date no existe en customers:",
        error.message,
      );
    }

    // Verificar columna retouch_service_id en customers
    try {
      const customers = await db.execute(
        sql`SELECT retouch_service_id FROM customers LIMIT 1`,
      );
      console.log("✅ Columna retouch_service_id existe en customers");
    } catch (error) {
      console.log(
        "❌ Columna retouch_service_id no existe en customers:",
        error.message,
      );
    }
  } catch (error) {
    console.error("❌ Error al verificar tablas:", error);
  }
}

checkRetouchTables();
