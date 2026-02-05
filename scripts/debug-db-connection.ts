import { db as webDb } from "../apps/web/lib/db";
import { sql } from "drizzle-orm";

async function debugDbConnection() {
  console.log("🔍 Depurando conexión a base de datos...");

  try {
    // Probar conexión desde el módulo web/lib/db
    console.log("\n--- Probando conexión desde web/lib/db ---");
    const result1 = await webDb.execute(
      sql`SELECT current_database(), current_user`,
    );
    console.log("✅ Conexión exitosa desde web/lib/db");
    console.log("Resultado:", result1);

    // Verificar tablas desde web/lib/db
    console.log("\n--- Verificando tablas desde web/lib/db ---");
    try {
      const tablesResult = await webDb.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('tenant_holidays', 'service_retouch_config')
      `);
      console.log("✅ Consulta de tablas específicas exitosa");
      console.log("Tablas encontradas:", tablesResult);
    } catch (error) {
      console.log("❌ Error al consultar tablas específicas:", error.message);
    }

    // Listar todas las tablas en el esquema public
    try {
      const allTablesResult = await webDb.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      console.log("\n✅ Consulta de todas las tablas exitosa");
      console.log("Todas las tablas en el esquema public:");
      if (allTablesResult.length === 0) {
        console.log("  No se encontraron tablas en el esquema public");
      } else {
        allTablesResult.forEach((row) => {
          console.log(`  - ${row.table_name}`);
        });
      }
    } catch (error) {
      console.log("❌ Error al consultar todas las tablas:", error.message);
    }

    // Listar todos los esquemas disponibles
    try {
      const schemasResult = await webDb.execute(sql`
        SELECT schema_name 
        FROM information_schema.schemata
        ORDER BY schema_name
      `);
      console.log("\n✅ Consulta de esquemas exitosa");
      console.log("Todos los esquemas disponibles:");
      schemasResult.forEach((row) => {
        console.log(`  - ${row.schema_name}`);
      });
    } catch (error) {
      console.log("❌ Error al consultar esquemas:", error.message);
    }

    // Listar tablas en el esquema actual
    try {
      const currentSchemaTablesResult = await webDb.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = current_schema()
        ORDER BY table_name
      `);
      console.log("\n✅ Consulta de tablas del esquema actual exitosa");
      console.log(
        "Esquema actual:",
        await webDb.execute(sql`SELECT current_schema()`),
      );
      console.log("Tablas en el esquema actual:");
      if (currentSchemaTablesResult.length === 0) {
        console.log("  No se encontraron tablas en el esquema actual");
      } else {
        currentSchemaTablesResult.forEach((row) => {
          console.log(`  - ${row.table_name}`);
        });
      }
    } catch (error) {
      console.log(
        "❌ Error al consultar tablas del esquema actual:",
        error.message,
      );
    }
  } catch (error) {
    console.error("❌ Error en la depuración:", error);
  }
}

debugDbConnection();
