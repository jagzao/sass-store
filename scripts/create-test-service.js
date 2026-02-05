const postgres = require("postgres");

// Obtener la URL de la base de datos desde las variables de entorno
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL no está definida en las variables de entorno");
  process.exit(1);
}

console.log("🔍 Creando servicio de prueba...");

// Crear cliente de PostgreSQL
const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: 1,
  idle_timeout: 10,
  connect_timeout: 5,
});

async function createTestService() {
  try {
    const tenantId = "c5f09699-c10e-4b3e-90b4-d65375a74516"; // Zo System tenant ID
    
    // Crear servicio de prueba
    const result = await client`
      INSERT INTO services (id, tenant_id, name, description, price, duration, featured, active, metadata, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        ${tenantId},
        'Servicio de Prueba Retoques',
        'Servicio creado para pruebas del sistema de fechas de retoque',
        500.00,
        60,
        false,
        true,
        '{}',
        NOW(),
        NOW()
      )
      RETURNING id
    `;
    
    console.log("✅ Servicio de prueba creado exitosamente");
    console.log("📋 ID del servicio:", result[0].id);
    
    return result[0].id;
  } catch (error) {
    console.error("❌ Error al crear servicio de prueba:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Ejecutar la función
createTestService();