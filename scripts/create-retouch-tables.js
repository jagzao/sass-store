const postgres = require("postgres");

// Obtener la URL de la base de datos desde las variables de entorno
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL no está definida en las variables de entorno");
  process.exit(1);
}

console.log("🔍 Conectando a la base de datos...");

// Crear cliente de PostgreSQL
const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: 1,
  idle_timeout: 10,
  connect_timeout: 5,
});

// No necesitamos Drizzle para este script, solo ejecutamos SQL directamente

async function createTables() {
  try {
    console.log("🚀 Creando tablas para el sistema de fechas de retoque...");

    // Crear tabla service_retouch_config
    console.log("📋 Creando tabla service_retouch_config...");
    await client`
      CREATE TABLE IF NOT EXISTS service_retouch_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        frequency_type VARCHAR(20) NOT NULL DEFAULT 'days',
        frequency_value INTEGER NOT NULL DEFAULT 15,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_default BOOLEAN NOT NULL DEFAULT false,
        business_days_only BOOLEAN NOT NULL DEFAULT false,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT service_retouch_config_tenant_service_unique UNIQUE (tenant_id, service_id)
      )
    `;
    console.log("✅ Tabla service_retouch_config creada exitosamente");

    // Crear índices para service_retouch_config
    console.log("📊 Creando índices para service_retouch_config...");
    await client`
      CREATE INDEX IF NOT EXISTS service_retouch_config_tenant_idx ON service_retouch_config(tenant_id)
    `;
    await client`
      CREATE INDEX IF NOT EXISTS service_retouch_config_service_idx ON service_retouch_config(service_id)
    `;
    await client`
      CREATE INDEX IF NOT EXISTS service_retouch_config_active_idx ON service_retouch_config(is_active)
    `;
    console.log("✅ Índices de service_retouch_config creados exitosamente");

    // Crear tabla tenant_holidays
    console.log("📋 Creando tabla tenant_holidays...");
    await client`
      CREATE TABLE IF NOT EXISTS tenant_holidays (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        affects_retouch BOOLEAN NOT NULL DEFAULT true,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT tenant_holidays_tenant_date_unique UNIQUE (tenant_id, date)
      )
    `;
    console.log("✅ Tabla tenant_holidays creada exitosamente");

    // Crear índices para tenant_holidays
    console.log("📊 Creando índices para tenant_holidays...");
    await client`
      CREATE INDEX IF NOT EXISTS tenant_holidays_tenant_idx ON tenant_holidays(tenant_id)
    `;
    await client`
      CREATE INDEX IF NOT EXISTS tenant_holidays_date_idx ON tenant_holidays(date)
    `;
    await client`
      CREATE INDEX IF NOT EXISTS tenant_holidays_affects_retouch_idx ON tenant_holidays(affects_retouch)
    `;
    console.log("✅ Índices de tenant_holidays creados exitosamente");

    // Habilitar RLS
    console.log("🔒 Habilitando Row Level Security...");
    await client`ALTER TABLE service_retouch_config ENABLE ROW LEVEL SECURITY`;
    await client`ALTER TABLE tenant_holidays ENABLE ROW LEVEL SECURITY`;
    console.log("✅ Row Level Security habilitado");

    // Crear políticas RLS
    console.log("🛡️ Creando políticas RLS...");
    await client`
      CREATE POLICY tenant_isolation_service_retouch_config ON service_retouch_config
      FOR ALL TO authenticated
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    `;
    await client`
      CREATE POLICY tenant_isolation_tenant_holidays ON tenant_holidays
      FOR ALL TO authenticated
      USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    `;
    console.log("✅ Políticas RLS creadas");

    // Conceder permisos
    console.log("🔐 Concediendo permisos...");
    await client`GRANT ALL ON service_retouch_config TO authenticated`;
    await client`GRANT ALL ON tenant_holidays TO authenticated`;
    console.log("✅ Permisos concedidos");

    // Verificar que las tablas se crearon
    console.log("🔍 Verificando tablas creadas...");
    const result = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('service_retouch_config', 'tenant_holidays')
      ORDER BY table_name
    `;

    console.log("✅ Tablas creadas exitosamente:");
    result.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log("🎉 ¡Migración completada con éxito!");
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Ejecutar la función
createTables();