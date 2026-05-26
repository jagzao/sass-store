import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const DRY_RUN = !process.argv.includes("--execute");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("❌ DATABASE_URL no encontrada en .env");
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

async function clean() {
  console.log(
    `🔍 Modo: ${DRY_RUN ? "DRY-RUN (usa --execute para aplicar)" : "EJECUCIÓN REAL"}\n`,
  );

  const tenants = await sql`
    SELECT id, slug FROM tenants WHERE slug = 'wondernails' LIMIT 1
  `;
  if (!tenants.length) {
    console.error("❌ Tenant 'wondernails' no encontrado");
    await sql.end();
    process.exit(1);
  }
  const tenantId = tenants[0].id;
  console.log(`✅ Tenant: wondernails (${tenantId})`);

  // Identificar customers de test
  const testCustomers = await sql`
    SELECT id, name, email
    FROM customers
    WHERE tenant_id = ${tenantId}
      AND name ILIKE 'Visit Tester%'
    ORDER BY name
  `;

  console.log(`👥 Customers de test a eliminar: ${testCustomers.length}`);
  testCustomers.forEach((c: any) => console.log(`   - ${c.name} (${c.email})`));

  if (testCustomers.length === 0) {
    console.log("\n✅ No hay datos de test por limpiar.");
    await sql.end();
    return;
  }

  const customerIds = testCustomers.map((c: any) => c.id);

  // Contar visits
  const visitsCount = await sql`
    SELECT COUNT(*) as count FROM customer_visits
    WHERE customer_id IN ${sql(customerIds)}
  `;
  console.log(
    `\n📅 Visitas ligadas que se eliminarán: ${visitsCount[0].count}`,
  );

  if (DRY_RUN) {
    console.log(
      "\n⚠️  DRY-RUN: No se borró nada. Usa --execute para aplicar cambios.",
    );
    await sql.end();
    return;
  }

  console.log("\n🗑️  Ejecutando limpieza...\n");

  // 1. Eliminar visits (ON DELETE CASCADE debería funcionar, pero por si acaso)
  const deletedVisits = await sql`
    DELETE FROM customer_visits
    WHERE customer_id IN ${sql(customerIds)}
    RETURNING id
  `;
  console.log(`✅ Visitas eliminadas: ${deletedVisits.length}`);

  // 2. Eliminar customers (verificar si hay FK en otras tablas)
  // bookings puede tener customer_id (nullable)
  const orphanedBookings = await sql`
    UPDATE bookings
    SET customer_id = NULL
    WHERE customer_id IN ${sql(customerIds)}
    RETURNING id
  `;
  if (orphanedBookings.length > 0) {
    console.log(
      `⚠️  Bookings desvinculados (customer_id -> NULL): ${orphanedBookings.length}`,
    );
  }

  // loyalty_points_summary
  const deletedLoyalty = await sql`
    DELETE FROM loyalty_points_summary WHERE customer_id IN ${sql(customerIds)}
    RETURNING id
  `;
  if (deletedLoyalty.length > 0) {
    console.log(
      `✅ Loyalty points summary eliminados: ${deletedLoyalty.length}`,
    );
  }

  // quotes
  const deletedQuotes = await sql`
    DELETE FROM quotes WHERE customer_id IN ${sql(customerIds)} RETURNING id
  `;
  if (deletedQuotes.length > 0) {
    console.log(`✅ Quotes eliminados: ${deletedQuotes.length}`);
  }

  // gift_cards
  const deletedGiftCards = await sql`
    DELETE FROM gift_cards WHERE customer_id IN ${sql(customerIds)} RETURNING id
  `;
  if (deletedGiftCards.length > 0) {
    console.log(`✅ Gift cards eliminados: ${deletedGiftCards.length}`);
  }

  // service_purchases
  const deletedPurchases = await sql`
    DELETE FROM service_purchases WHERE customer_id IN ${sql(customerIds)} RETURNING id
  `;
  if (deletedPurchases.length > 0) {
    console.log(`✅ Service purchases eliminados: ${deletedPurchases.length}`);
  }

  // Eliminar customers
  const deletedCustomers = await sql`
    DELETE FROM customers
    WHERE tenant_id = ${tenantId} AND name ILIKE 'Visit Tester%'
    RETURNING id, name
  `;
  console.log(`\n✅ Customers eliminados: ${deletedCustomers.length}`);
  deletedCustomers.forEach((c: any) => console.log(`   - ${c.name}`));

  // Resumen final
  const totalAfter =
    await sql`SELECT COUNT(*) as count FROM customers WHERE tenant_id = ${tenantId}`;
  console.log(
    `\n📊 Total customers en wondernails después: ${totalAfter[0].count}`,
  );

  await sql.end();
  console.log("\n🎯 Limpieza completada.");
}

clean().catch((err) => {
  console.error("❌ Error:", err);
  sql.end().catch(() => {});
  process.exit(1);
});
