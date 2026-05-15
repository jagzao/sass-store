import postgres from "postgres";

async function checkSeedData() {
  console.log("🔍 Verificando datos en Supabase...\n");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes("localhost")) {
    console.error("❌ DATABASE_URL no está configurada");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    console.log("═".repeat(70));
    console.log("📊 REPORTE DE SEED DATA EN SUPABASE");
    console.log("═".repeat(70));
    console.log("");

    // 1. Tenants
    console.log("1️⃣  TENANTS");
    console.log("─".repeat(70));
    const tenants = await sql`
      SELECT id, name, slug, status, mode
      FROM tenants
      ORDER BY name;
    `;
    console.log(`   Total: ${tenants.length} tenants\n`);
    tenants.forEach((t) => {
      console.log(`   ✅ ${t.name} (@${t.slug})`);
      console.log(`      Mode: ${t.mode} | Status: ${t.status}`);
    });
    console.log("");

    // 2. Products
    console.log("2️⃣  PRODUCTS");
    console.log("─".repeat(70));
    const products = await sql`
      SELECT
        p.tenant_id,
        t.name as tenant_name,
        COUNT(*) as count
      FROM products p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      GROUP BY p.tenant_id, t.name
      ORDER BY t.name;
    `;
    const totalProducts = products.reduce(
      (sum, p) => sum + parseInt(p.count),
      0,
    );
    console.log(`   Total: ${totalProducts} productos\n`);
    products.forEach((p) => {
      console.log(`   📦 ${p.tenant_name}: ${p.count} productos`);
    });
    console.log("");

    // 3. Services
    console.log("3️⃣  SERVICES");
    console.log("─".repeat(70));
    const services = await sql`
      SELECT
        s.tenant_id,
        t.name as tenant_name,
        COUNT(*) as count
      FROM services s
      LEFT JOIN tenants t ON s.tenant_id = t.id
      GROUP BY s.tenant_id, t.name
      ORDER BY t.name;
    `;
    const totalServices = services.reduce(
      (sum, s) => sum + parseInt(s.count),
      0,
    );
    console.log(`   Total: ${totalServices} servicios\n`);
    services.forEach((s) => {
      console.log(`   💈 ${s.tenant_name}: ${s.count} servicios`);
    });
    console.log("");

    // 4. CAMPAIGNS (NUEVA TABLA)
    console.log("4️⃣  CAMPAIGNS 🆕 (Campañas de Marketing)");
    console.log("─".repeat(70));
    const campaigns = await sql`
      SELECT
        c.id, c.name, c.type, c.slug, c.lut_file, c.tenant_id,
        t.name as tenant_name
      FROM campaigns c
      LEFT JOIN tenants t ON c.tenant_id = t.id
      ORDER BY t.name, c.name;
    `;
    console.log(`   Total: ${campaigns.length} campañas\n`);

    if (campaigns.length > 0) {
      const campaignsByTenant = {};
      campaigns.forEach((c) => {
        if (!campaignsByTenant[c.tenant_name]) {
          campaignsByTenant[c.tenant_name] = [];
        }
        campaignsByTenant[c.tenant_name].push(c);
      });

      Object.entries(campaignsByTenant).forEach(
        ([tenantName, campaigns]: [string, any]) => {
          console.log(`   📢 ${tenantName}: ${campaigns.length} campañas`);
          campaigns.forEach((c: any) => {
            console.log(`      ✅ ${c.name} (${c.type})`);
            console.log(`         • Slug: ${c.slug}`);
            console.log(`         • LUT: ${c.lut_file || "Sin LUT"}`);
          });
          console.log("");
        },
      );
    } else {
      console.log("   ⚠️  No hay campañas creadas");
    }

    // 5. REELS (NUEVA TABLA)
    console.log("5️⃣  REELS 🆕 (Videos para Redes Sociales)");
    console.log("─".repeat(70));
    const reels = await sql`
      SELECT
        r.id, r.title, r.status, r.tenant_id,
        array_length(r.image_urls, 1) as image_count,
        t.name as tenant_name,
        c.name as campaign_name
      FROM reels r
      LEFT JOIN tenants t ON r.tenant_id = t.id
      LEFT JOIN campaigns c ON r.campaign_id = c.id
      ORDER BY t.name, r.created_at DESC;
    `;
    console.log(`   Total: ${reels.length} reels\n`);

    if (reels.length > 0) {
      const reelsByTenant = {};
      reels.forEach((r) => {
        if (!reelsByTenant[r.tenant_name]) {
          reelsByTenant[r.tenant_name] = [];
        }
        reelsByTenant[r.tenant_name].push(r);
      });

      Object.entries(reelsByTenant).forEach(
        ([tenantName, reels]: [string, any]) => {
          console.log(`   🎬 ${tenantName}: ${reels.length} reels`);
          reels.forEach((r: any) => {
            console.log(`      • ${r.title} (${r.status})`);
            console.log(`        Campaña: ${r.campaign_name || "Sin campaña"}`);
            console.log(`        Imágenes: ${r.image_count || 0}`);
          });
        },
      );
    } else {
      console.log(
        "   ℹ️  No hay reels creados (es normal, se generan dinámicamente)",
      );
    }
    console.log("");

    // 6. Orders
    console.log("6️⃣  ORDERS (Pedidos)");
    console.log("─".repeat(70));
    const orders = await sql`
      SELECT
        o.tenant_id,
        t.name as tenant_name,
        COUNT(*) as count,
        SUM(o.total::numeric) as total_sales
      FROM orders o
      LEFT JOIN tenants t ON o.tenant_id = t.id
      GROUP BY o.tenant_id, t.name
      ORDER BY t.name;
    `;
    const totalOrders = orders.reduce((sum, o) => sum + parseInt(o.count), 0);
    const totalSales = orders.reduce(
      (sum, o) => sum + parseFloat(o.total_sales || 0),
      0,
    );
    console.log(
      `   Total: ${totalOrders} pedidos | Ventas: $${totalSales.toFixed(2)}\n`,
    );
    orders.forEach((o) => {
      console.log(
        `   🛒 ${o.tenant_name}: ${o.count} pedidos ($${parseFloat(o.total_sales).toFixed(2)})`,
      );
    });
    console.log("");

    // 7. Bookings
    console.log("7️⃣  BOOKINGS (Reservas)");
    console.log("─".repeat(70));
    const bookings = await sql`
      SELECT
        b.tenant_id,
        t.name as tenant_name,
        COUNT(*) as count
      FROM bookings b
      LEFT JOIN tenants t ON b.tenant_id = t.id
      GROUP BY b.tenant_id, t.name
      ORDER BY t.name;
    `;
    const totalBookings = bookings.reduce(
      (sum, b) => sum + parseInt(b.count),
      0,
    );
    console.log(`   Total: ${totalBookings} reservas\n`);
    bookings.forEach((b) => {
      console.log(`   📅 ${b.tenant_name}: ${b.count} reservas`);
    });
    console.log("");

    // 8. Users
    console.log("8️⃣  USERS (Usuarios)");
    console.log("─".repeat(70));
    const usersCount = await sql`
      SELECT COUNT(*) as count FROM users;
    `;
    console.log(`   Total: ${usersCount[0].count} usuarios registrados\n`);

    // Resumen final
    console.log("═".repeat(70));
    console.log("📊 RESUMEN GENERAL");
    console.log("═".repeat(70));
    console.log(`✅ Tenants: ${tenants.length}`);
    console.log(`✅ Productos: ${totalProducts}`);
    console.log(`✅ Servicios: ${totalServices}`);
    console.log(`✅ Campañas: ${campaigns.length} 🆕`);
    console.log(`✅ Reels: ${reels.length} 🆕`);
    console.log(
      `✅ Pedidos: ${totalOrders} (Ventas: $${totalSales.toFixed(2)})`,
    );
    console.log(`✅ Reservas: ${totalBookings}`);
    console.log(`✅ Usuarios: ${usersCount[0].count}`);
    console.log("═".repeat(70));

    // Estado de seed
    if (tenants.length > 0 && (totalProducts > 0 || totalServices > 0)) {
      console.log("\n🎉 ¡Tu base de datos tiene seed data y está lista!");
      if (campaigns.length > 0) {
        console.log(
          "✅ Las nuevas tablas de CAMPAIGNS y REELS están creadas y pobladas",
        );
      }
    } else {
      console.log("\n⚠️  Tu base de datos parece estar vacía");
      console.log("💡 Ejecuta: npm run seed");
    }
    console.log("");

    await sql.end();
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    await sql.end();
    throw error;
  }
}

// Ejecutar verificación
checkSeedData()
  .then(() => {
    console.log("✅ Verificación completada");
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
