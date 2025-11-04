const { Pool } = require("pg");
require("dotenv").config({ path: "apps/api/.env.local" });

async function checkDatabaseStatus() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("🔍 Verificando estado de la base de datos...\n");

    // Check if financial tables exist
    const tables = [
      "mercadopago_tokens",
      "mercadopago_payments",
      "financial_movements",
      "pos_terminals",
      "financial_kpis",
    ];

    console.log("📋 Verificando tablas financieras:\n");

    for (const table of tables) {
      try {
        const result = await pool.query(
          `
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          )
        `,
          [table]
        );

        const exists = result.rows[0].exists;
        console.log(
          `   ${table.padEnd(20)} ${exists ? "✅ EXISTE" : "❌ FALTA"}`
        );
      } catch (error) {
        console.log(`   ${table.padEnd(20)} ❌ ERROR: ${error.message}`);
      }
    }

    console.log("\n🔒 Verificando RLS en tablas principales:\n");

    const rlsTables = [
      "tenants",
      "products",
      "services",
      "bookings",
      "orders",
      "financial_movements",
    ];
    for (const table of rlsTables) {
      try {
        const result = await pool.query(
          `
          SELECT tablename, rowsecurity
          FROM pg_tables
          WHERE schemaname = 'public' AND tablename = $1
        `,
          [table]
        );

        if (result.rows.length > 0) {
          const rowsecurity = result.rows[0].rowsecurity;
          console.log(
            `   ${table.padEnd(20)} ${rowsecurity ? "✅ RLS HABILITADO" : "❌ RLS DESHABILITADO"}`
          );
        } else {
          console.log(`   ${table.padEnd(20)} ⚠️  TABLA NO EXISTE`);
        }
      } catch (error) {
        console.log(`   ${table.padEnd(20)} ❌ ERROR: ${error.message}`);
      }
    }

    // Check financial_movements structure
    console.log("\n📊 Verificando estructura de financial_movements:\n");
    try {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'financial_movements'
        ORDER BY ordinal_position
      `);

      const columns = result.rows;
      const reconciledCol = columns.find(
        (col) => col.column_name === "reconciled"
      );
      const reconciliationIdCol = columns.find(
        (col) => col.column_name === "reconciliation_id"
      );

      console.log(
        `   reconciled column:     ${reconciledCol ? "✅ EXISTE" : "❌ FALTA"}`
      );
      console.log(
        `   reconciliation_id col: ${reconciliationIdCol ? "✅ EXISTE" : "❌ FALTA"}`
      );

      if (reconciledCol) {
        console.log(`     - Tipo: ${reconciledCol.data_type}`);
        console.log(
          `     - Default: ${reconciledCol.column_default || "NULL"}`
        );
      }
    } catch (error) {
      console.log("   ❌ Error verificando estructura:", error.message);
    }

    console.log("\n✅ Verificación completada!\n");
  } catch (error) {
    console.error("❌ Error general:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDatabaseStatus();
