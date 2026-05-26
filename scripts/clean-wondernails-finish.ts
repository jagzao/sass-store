import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("❌ DATABASE_URL no encontrada");
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

async function finish() {
  const tenants = await sql`
    SELECT id FROM tenants WHERE slug = 'wondernails' LIMIT 1
  `;
  const tenantId = tenants[0].id;

  // Solo eliminar customers tipo Visit Tester (que ahora están huérfanos de visits/bookings)
  const deleted = await sql`
    DELETE FROM customers
    WHERE tenant_id = ${tenantId} AND name ILIKE 'Visit Tester%'
    RETURNING id, name
  `;
  console.log(`✅ Customers eliminados: ${deleted.length}`);
  deleted.forEach((c: any) => console.log(`   - ${c.name}`));

  const totalAfter =
    await sql`SELECT COUNT(*) as count FROM customers WHERE tenant_id = ${tenantId}`;
  console.log(
    `\n📊 Total customers restantes en wondernails: ${totalAfter[0].count}`,
  );

  await sql.end();
}

finish().catch((err) => {
  console.error("❌ Error:", err);
  sql.end().catch(() => {});
  process.exit(1);
});
