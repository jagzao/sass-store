import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

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

async function diagnose() {
  console.log("🔍 Diagnosticando datos de test en tenant 'wondernails'...\n");

  // 1. Obtener tenantId de wondernails
  const tenants = await sql`
    SELECT id, slug, name FROM tenants WHERE slug = 'wondernails' LIMIT 1
  `;
  if (!tenants.length) {
    console.error("❌ Tenant 'wondernails' no encontrado");
    await sql.end();
    process.exit(1);
  }
  const tenantId = tenants[0].id;
  console.log(`✅ Tenant encontrado: wondernails (${tenantId})\n`);

  // 2. Buscar customers con nombre como "Visit Tester %"
  const testCustomers = await sql`
    SELECT id, name, email, phone, created_at
    FROM customers
    WHERE tenant_id = ${tenantId}
      AND name ILIKE 'Visit Tester%'
    ORDER BY created_at DESC
  `;
  console.log(`👥 Customers tipo "Visit Tester": ${testCustomers.length}`);
  testCustomers.slice(0, 10).forEach((c: any) => {
    console.log(
      `   - ${c.name} | ${c.email || "(sin email)"} | ${c.phone || "(sin tel)"} | ${c.created_at}`,
    );
  });
  if (testCustomers.length > 10)
    console.log(`   ... y ${testCustomers.length - 10} más`);

  // 3. Buscar customers con email temporal de test
  const tempEmailCustomers = await sql`
    SELECT id, name, email, phone, created_at
    FROM customers
    WHERE tenant_id = ${tenantId}
      AND email ILIKE '%@example.com'
    ORDER BY created_at DESC
    LIMIT 20
  `;
  console.log(
    `\n📧 Customers con email @example.com: ${tempEmailCustomers.length}`,
  );
  tempEmailCustomers.forEach((c: any) => {
    console.log(`   - ${c.name} | ${c.email} | ${c.created_at}`);
  });

  // 4. Buscar customers con nombre genérico de test
  const genericTestCustomers = await sql`
    SELECT id, name, email, phone, created_at
    FROM customers
    WHERE tenant_id = ${tenantId}
      AND (
        name ILIKE 'test%'
        OR name ILIKE '%tester%'
        OR name ILIKE 'user%'
        OR email ILIKE '%test%'
        OR email ILIKE '%playwright%'
      )
    ORDER BY created_at DESC
    LIMIT 20
  `;
  console.log(
    `\n🧪 Customers genéricos de test: ${genericTestCustomers.length}`,
  );
  genericTestCustomers.forEach((c: any) => {
    console.log(
      `   - ${c.name} | ${c.email || "(sin email)"} | ${c.created_at}`,
    );
  });

  // 5. Contar visits de estos customers
  if (testCustomers.length > 0) {
    const customerIds = testCustomers.map((c: any) => c.id);
    const visits = await sql`
      SELECT COUNT(*) as count FROM customer_visits
      WHERE customer_id IN ${sql(customerIds)}
    `;
    console.log(`\n📅 Visitas ligadas a "Visit Tester": ${visits[0].count}`);
  }

  // 6. Resumen total de customers en wondernails
  const total =
    await sql`SELECT COUNT(*) as count FROM customers WHERE tenant_id = ${tenantId}`;
  console.log(`\n📊 Total customers en wondernails: ${total[0].count}`);

  await sql.end();
}

diagnose().catch((err) => {
  console.error("❌ Error:", err);
  sql.end().catch(() => {});
  process.exit(1);
});
