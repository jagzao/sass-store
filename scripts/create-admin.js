const { db } = require("../packages/database/src/db");
const bcrypt = require("bcryptjs");

async function createAdminUser() {
  try {
    console.log("🔍 Buscando tenant manada-juma...");

    // Buscar tenant
    const tenantResult = await db.query(
      "SELECT id FROM tenants WHERE slug = $1",
      ["manada-juma"],
    );

    if (tenantResult.rows.length === 0) {
      console.error("❌ Tenant manada-juma no encontrado");
      process.exit(1);
    }

    const tenantId = tenantResult.rows[0].id;
    console.log("✅ Tenant encontrado:", tenantId);

    // Hash de la contraseña "admin"
    const hashedPassword = await bcrypt.hash("admin", 10);
    console.log("🔐 Contraseña hasheada");

    // Crear usuario
    const userResult = await db.query(
      `
      INSERT INTO users (id, email, password, name, tenant_id, role, email_verified, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        password = $2,
        tenant_id = $4,
        role = $5,
        updated_at = NOW()
      RETURNING id, email, name, role
      `,
      ["jagzao@gmail.com", hashedPassword, "Admin User", tenantId, "admin"],
    );

    console.log("✅ Usuario admin creado/actualizado:", userResult.rows[0]);

    // Verificar
    const verifyResult = await db.query(
      `
      SELECT u.email, u.name, u.role, t.slug, t.name as tenant_name
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = $1 AND t.slug = $2
      `,
      ["jagzao@gmail.com", "manada-juma"],
    );

    console.log("✅ Verificación:", verifyResult.rows[0]);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

createAdminUser();
