import { db } from "../apps/web/lib/db/connection";
import { sql } from "drizzle-orm";

async function checkTenantsSchema() {
  console.log("=== Verificando esquema de la tabla tenants ===\n");

  try {
    // Verificar la base de datos actual
    const currentDb = await db.execute(sql`SELECT current_database();`);
    console.log("=== Base de datos actual ===");
    console.table(currentDb);

    // Listar todas las tablas
    const allTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("\n=== Todas las tablas en la base de datos ===");
    if (allTables.length === 0) {
      console.log("No se encontraron tablas");
    } else {
      console.table(allTables);
    }

    // Verificar si la tabla tenants existe
    const tableExists = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'tenants';
    `);

    console.log("\n=== Verificación de tabla tenants ===");
    console.log(
      `Tabla 'tenants': ${tableExists.length > 0 ? "EXISTS" : "NOT FOUND"}`,
    );

    if (tableExists.length === 0) {
      console.log("\n❌ La tabla tenants no existe en la base de datos");
      return;
    }

    // Verificar columnas de la tabla tenants
    const columns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenants'
      ORDER BY ordinal_position;
    `);

    console.log("\n=== Columnas encontradas ===");
    if (columns.length === 0) {
      console.log("No se encontraron columnas");
    } else {
      console.table(columns);
    }

    // Verificar si existe la columna branding (con i)
    const brandingWithI = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      AND column_name = 'branding';
    `);

    // Verificar si existe la columna branding (sin i)
    const brandingWithoutI = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      AND column_name = 'branding';
    `);

    console.log("\n=== Verificación de columna branding ===");
    console.log(
      `Columna 'branding' (con i): ${brandingWithI.length > 0 ? "EXISTS" : "NOT FOUND"}`,
    );
    console.log(
      `Columna 'branding' (sin i): ${brandingWithoutI.length > 0 ? "EXISTS" : "NOT FOUND"}`,
    );

    // Verificar si existen columnas de Google Calendar
    const googleCalendarColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      AND column_name LIKE 'google_%';
    `);

    console.log("\n=== Columnas de Google Calendar ===");
    if (googleCalendarColumns.length === 0) {
      console.log("No se encontraron columnas de Google Calendar");
    } else {
      console.table(googleCalendarColumns);
    }
  } catch (error) {
    console.error("Error al verificar el esquema:", error);
    throw error;
  }
}

checkTenantsSchema()
  .then(() => {
    console.log("\n✅ Verificación completada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
