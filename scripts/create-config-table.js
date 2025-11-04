const { Pool } = require("pg");
require("dotenv").config({ path: "apps/api/.env.local" });

async function createConfigTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("🔧 Creando tabla tenant_configs...\n");

    // Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        key VARCHAR(100) NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, category, key)
      );
    `);
    console.log("✅ Tabla tenant_configs creada");

    // Enable RLS
    await pool.query(`ALTER TABLE tenant_configs ENABLE ROW LEVEL SECURITY;`);
    console.log("✅ RLS habilitado");

    // Create policy
    await pool.query(`
      CREATE POLICY tenant_configs_tenant_isolation ON tenant_configs
      FOR ALL USING (tenant_id = get_current_tenant_id());
    `);
    console.log("✅ Política RLS creada");

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_configs_tenant_category
      ON tenant_configs(tenant_id, category);
    `);
    console.log("✅ Índices creados");

    // Grant permissions
    await pool.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_configs TO authenticated;`
    );
    console.log("✅ Permisos otorgados");

    // Verify
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tenant_configs'
      )
    `);

    if (result.rows[0].exists) {
      console.log("\n✅ Tabla tenant_configs lista para usar!\n");
    } else {
      console.log("\n❌ Error: Tabla no encontrada\n");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createConfigTable();
