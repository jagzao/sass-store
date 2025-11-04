import postgres from 'postgres';

async function checkSeedData() {
  console.log('🔍 Verificando datos en la base de datos de Supabase...\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes('localhost')) {
    console.error('❌ DATABASE_URL no está configurada o apunta a localhost');
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    console.log('═'.repeat(70));
    console.log('📊 VERIFICACIÓN COMPLETA DE SEED DATA');
    console.log('═'.repeat(70));
    console.log('');

    // 1. Tenants
    console.log('1️⃣  TENANTS (Inquilinos/Marcas)');
    console.log('─'.repeat(70));
    const tenants = await sql`
      SELECT id, name, slug, status, mode, created_at
      FROM tenants
      ORDER BY name;
    `;
    console.log(`   Total: ${tenants.length} tenants`);
    if (tenants.length > 0) {
      tenants.forEach(t => {
        console.log(`   ✅ ${t.name} (@${t.slug})`);
        console.log(`      ID: ${t.id}`);
        console.log(`      Mode: ${t.mode || 'catalog'}`);
        console.log(`      Status: ${t.status || 'active'}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No hay tenants creados');
    }
    console.log('');

    // 2. Users
    console.log('2️⃣  USERS (Usuarios)');
    console.log('─'.repeat(70));
    const users = await sql`
      SELECT id, name, email, tenant_id, created_at
      FROM users
      ORDER BY created_at;
    `;
    console.log(`   Total: ${users.length} usuarios`);
    if (users.length > 0) {
      // Agrupar por tenant
      const usersByTenant = tenants.map(t => ({
        tenant: t,
        users: users.filter(u => u.tenant_id === t.id)
      }));

      usersByTenant.forEach(({ tenant, users }) => {
        if (users.length > 0) {
          console.log(`   📌 ${tenant.name}:`);
          users.forEach(u => {
            console.log(`      • ${u.name || 'Sin nombre'} (${u.email})`);
          });
        }
      });

      const noTenantUsers = users.filter(u => !u.tenant_id);
      if (noTenantUsers.length > 0) {
        console.log(`   📌 Sin tenant asignado:`);
        noTenantUsers.forEach(u => {
          console.log(`      • ${u.name || 'Sin nombre'} (${u.email})`);
        });
      }
    } else {
      console.log('   ⚠️  No hay usuarios creados');
    }
    console.log('');

    // 3. Products
    console.log('3️⃣  PRODUCTS (Productos)');
    console.log('─'.repeat(70));
    const products = await sql`
      SELECT
        p.id, p.name, p.price, p.tenant_id, p.category, p.active,
        t.name as tenant_name
      FROM products p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      ORDER BY t.name, p.name;
    `;
    console.log(`   Total: ${products.length} productos`);
    if (products.length > 0) {
      const productsByTenant = tenants.map(t => ({
        tenant: t,
        products: products.filter(p => p.tenant_id === t.id)
      }));

      productsByTenant.forEach(({ tenant, products }) => {
        if (products.length > 0) {
          console.log(`   📌 ${tenant.name}: ${products.length} productos`);
          products.slice(0, 3).forEach(p => {
            const status = p.active ? '✅' : '❌';
            console.log(`      ${status} ${p.name} - $${p.price} (${p.category})`);
          });
          if (products.length > 3) {
            console.log(`      ... y ${products.length - 3} más`);
          }
        }
      });
    } else {
      console.log('   ⚠️  No hay productos creados');
    }
    console.log('');

    // 4. Services
    console.log('4️⃣  SERVICES (Servicios)');
    console.log('─'.repeat(70));
    const services = await sql`
      SELECT
        s.id, s.name, s.price, s.duration, s.tenant_id,
        t.name as tenant_name
      FROM services s
      LEFT JOIN tenants t ON s.tenant_id = t.id
      ORDER BY t.name, s.name;
    `;
    console.log(`   Total: ${services.length} servicios`);
    if (services.length > 0) {
      const servicesByTenant = tenants.map(t => ({
        tenant: t,
        services: services.filter(s => s.tenant_id === t.id)
      }));

      servicesByTenant.forEach(({ tenant, services }) => {
        if (services.length > 0) {
          console.log(`   📌 ${tenant.name}: ${services.length} servicios`);
          services.slice(0, 3).forEach(s => {
            console.log(`      • ${s.name} - $${s.price} (${s.duration} min)`);
          });
          if (services.length > 3) {
            console.log(`      ... y ${services.length - 3} más`);
          }
        }
      });
    } else {
      console.log('   ⚠️  No hay servicios creados');
    }
    console.log('');

    // 5. Campaigns (NUEVO)
    console.log('5️⃣  CAMPAIGNS (Campañas de Marketing) - ¡NUEVA TABLA!');
    console.log('─'.repeat(70));
    const campaigns = await sql`
      SELECT
        c.id, c.name, c.type, c.slug, c.lut_file, c.tenant_id,
        t.name as tenant_name
      FROM campaigns c
      LEFT JOIN tenants t ON c.tenant_id = t.id
      ORDER BY t.name, c.name;
    `;
    console.log(`   Total: ${campaigns.length} campañas`);
    if (campaigns.length > 0) {
      const campaignsByTenant = tenants.map(t => ({
        tenant: t,
        campaigns: campaigns.filter(c => c.tenant_id === t.id)
      }));

      campaignsByTenant.forEach(({ tenant, campaigns }) => {
        if (campaigns.length > 0) {
          console.log(`   📌 ${tenant.name}: ${campaigns.length} campañas`);
          campaigns.forEach(c => {
            console.log(`      ✅ ${c.name} (${c.type})`);
            console.log(`         Slug: ${c.slug}`);
            console.log(`         LUT: ${c.lut_file || 'N/A'}`);
          });
        }
      });
    } else {
      console.log('   ⚠️  No hay campañas creadas');
    }
    console.log('');

    // 6. Reels (NUEVO)
    console.log('6️⃣  REELS (Videos) - ¡NUEVA TABLA!');
    console.log('─'.repeat(70));
    const reels = await sql`
      SELECT
        r.id, r.title, r.status, r.tenant_id, r.campaign_id,
        array_length(r.image_urls, 1) as image_count,
        t.name as tenant_name,
        c.name as campaign_name
      FROM reels r
      LEFT JOIN tenants t ON r.tenant_id = t.id
      LEFT JOIN campaigns c ON r.campaign_id = c.id
      ORDER BY t.name, r.created_at DESC;
    `;
    console.log(`   Total: ${reels.length} reels`);
    if (reels.length > 0) {
      const reelsByTenant = tenants.map(t => ({
        tenant: t,
        reels: reels.filter(r => r.tenant_id === t.id)
      }));

      reelsByTenant.forEach(({ tenant, reels }) => {
        if (reels.length > 0) {
          console.log(`   📌 ${tenant.name}: ${reels.length} reels`);
          reels.slice(0, 5).forEach(r => {
            console.log(`      • ${r.title} (${r.status})`);
            console.log(`        Campaña: ${r.campaign_name || 'Sin campaña'}`);
            console.log(`        Imágenes: ${r.image_count || 0}`);
          });
          if (reels.length > 5) {
            console.log(`      ... y ${reels.length - 5} más`);
          }
        }
      });
    } else {
      console.log('   ⚠️  No hay reels creados (esto es normal, se crean dinámicamente)');
    }
    console.log('');

    // 7. Orders
    console.log('7️⃣  ORDERS (Pedidos)');
    console.log('─'.repeat(70));
    const orders = await sql`
      SELECT
        o.id, o.status, o.total, o.tenant_id,
        t.name as tenant_name
      FROM orders o
      LEFT JOIN tenants t ON o.tenant_id = t.id
      ORDER BY o.created_at DESC
      LIMIT 10;
    `;
    console.log(`   Total (últimos 10): ${orders.length} pedidos`);
    if (orders.length > 0) {
      const ordersByTenant = tenants.map(t => ({
        tenant: t,
        orders: orders.filter(o => o.tenant_id === t.id)
      }));

      ordersByTenant.forEach(({ tenant, orders }) => {
        if (orders.length > 0) {
          console.log(`   📌 ${tenant.name}: ${orders.length} pedidos recientes`);
          const totalSales = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
          console.log(`      Total ventas: $${totalSales.toFixed(2)}`);
        }
      });
    } else {
      console.log('   ⚠️  No hay pedidos registrados');
    }
    console.log('');

    // 8. Bookings
    console.log('8️⃣  BOOKINGS (Reservas)');
    console.log('─'.repeat(70));
    const bookings = await sql`
      SELECT
        b.id, b.status, b.start_time, b.tenant_id,
        t.name as tenant_name
      FROM bookings b
      LEFT JOIN tenants t ON b.tenant_id = t.id
      ORDER BY b.start_time DESC
      LIMIT 10;
    `;
    console.log(`   Total (últimas 10): ${bookings.length} reservas`);
    if (bookings.length > 0) {
      const bookingsByTenant = tenants.map(t => ({
        tenant: t,
        bookings: bookings.filter(b => b.tenant_id === t.id)
      }));

      bookingsByTenant.forEach(({ tenant, bookings }) => {
        if (bookings.length > 0) {
          console.log(`   📌 ${tenant.name}: ${bookings.length} reservas recientes`);
        }
      });
    } else {
      console.log('   ⚠️  No hay reservas registradas');
    }
    console.log('');

    // Resumen final
    console.log('═'.repeat(70));
    console.log('📊 RESUMEN GENERAL');
    console.log('═'.repeat(70));
    console.log(`✅ Tenants: ${tenants.length}`);
    console.log(`✅ Usuarios: ${users.length}`);
    console.log(`✅ Productos: ${products.length}`);
    console.log(`✅ Servicios: ${services.length}`);
    console.log(`✅ Campañas: ${campaigns.length} (NUEVO)`);
    console.log(`✅ Reels: ${reels.length} (NUEVO)`);
    console.log(`✅ Pedidos: ${orders.length}+ (solo últimos 10)`);
    console.log(`✅ Reservas: ${bookings.length}+ (solo últimas 10)`);
    console.log('═'.repeat(70));

    // Verificar si necesita seed
    const needsSeed = tenants.length === 0 ||
                     (products.length === 0 && services.length === 0);

    if (needsSeed) {
      console.log('\n⚠️  RECOMENDACIÓN: Tu base de datos parece vacía.');
      console.log('💡 Deberías ejecutar el seed para poblarla con datos iniciales:');
      console.log('   npm run seed\n');
    } else {
      console.log('\n🎉 Tu base de datos tiene datos y está lista para usar!\n');
    }

    await sql.end();

  } catch (error: any) {
    console.error('\n❌ Error al verificar datos:', error.message);
    await sql.end();
    throw error;
  }
}

// Ejecutar verificación
checkSeedData()
  .then(() => {
    console.log('✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en verificación');
    process.exit(1);
  });
