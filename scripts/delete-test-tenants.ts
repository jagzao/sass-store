import "dotenv/config";
import { db } from "@sass-store/database";
import {
  tenants,
  products,
  services,
  customers,
  customerVisits,
  bookings,
  orders,
  orderItems,
  payments,
  staff,
  mediaAssets,
  tenantConfigs,
  apiKeys,
  auditLogs,
  socialPosts,
  tenantChannels,
  channelAccounts,
  channelCredentials,
  postJobs,
  contentVariants,
  postingRules,
  postResults,
  socialPostTargets,
  tenantQuotas,
  inventoryTransactions,
  inventoryAlerts,
  productInventory,
  customerAdvances,
  advanceApplications,
  posTerminals,
  mercadopagoTokens,
  mercadopagoPayments,
  userRoles,
  tenantHolidays,
  serviceProducts,
  serviceQuotes,
  serviceRetouchConfig,
  productAlertConfig,
} from "@sass-store/database/schema";
import { eq, inArray, ilike, sql } from "drizzle-orm";

async function deleteTestTenants() {
  console.log("Searching for 'Test Tenant'...");

  // Use query builder instead of db.query for robust access
  const tenantsToDelete = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .where(ilike(tenants.name, "%Test Tenant%"));

  if (tenantsToDelete.length === 0) {
    console.log("No tenants found with name containing 'Test Tenant'");
    process.exit(0);
  }

  console.log(`Found ${tenantsToDelete.length} tenants to delete:`);
  tenantsToDelete.forEach((t) => console.log(`- ${t.name} (${t.slug})`));

  for (const tenant of tenantsToDelete) {
    const id = tenant.id;
    console.log(`Deleting tenant: ${tenant.name} (${id})...`);

    await db.execute(sql`SELECT set_tenant_context(${id}::uuid)`);
    // 1. Social Planner / Marketing
    await db.execute(sql`DELETE FROM post_jobs WHERE tenant_id = ${id}::uuid`);

    // Social Posts Variants & Targets
    await db.execute(sql`
      DELETE FROM content_variants WHERE social_post_id IN (SELECT id FROM social_posts WHERE tenant_id = ${id}::uuid)
    `);
    await db.execute(sql`
      DELETE FROM social_post_targets WHERE post_id IN (SELECT id FROM social_posts WHERE tenant_id = ${id}::uuid)
    `);
    await db.execute(
      sql`DELETE FROM social_posts WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(
      sql`DELETE FROM posting_rules WHERE tenant_id = ${id}::uuid`,
    );

    // Channels
    await db.execute(sql`
      DELETE FROM channel_credentials WHERE account_id IN (
        SELECT id FROM channel_accounts WHERE tenant_channel_id IN (
          SELECT id FROM tenant_channels WHERE tenant_id = ${id}::uuid
        )
      )
    `);
    await db.execute(sql`
      DELETE FROM channel_accounts WHERE tenant_channel_id IN (
        SELECT id FROM tenant_channels WHERE tenant_id = ${id}::uuid
      )
    `);
    await db.execute(
      sql`DELETE FROM tenant_channels WHERE tenant_id = ${id}::uuid`,
    );

    // 2. E-Commerce / POS
    await db.execute(sql`
      DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = ${id}::uuid)
    `);
    await db.execute(sql`DELETE FROM payments WHERE tenant_id = ${id}::uuid`);
    await db.execute(
      sql`DELETE FROM mercadopago_payments WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(sql`DELETE FROM orders WHERE tenant_id = ${id}::uuid`);
    await db.execute(
      sql`DELETE FROM mercadopago_tokens WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(
      sql`DELETE FROM pos_terminals WHERE tenant_id = ${id}::uuid`,
    );

    // 3. Inventory & Catalog
    await db.execute(
      sql`DELETE FROM inventory_transactions WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(
      sql`DELETE FROM inventory_alerts WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(
      sql`DELETE FROM product_inventory WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(
      sql`DELETE FROM product_alert_config WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(
      sql`DELETE FROM service_products WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(
      sql`DELETE FROM service_quotes WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(
      sql`DELETE FROM service_retouch_config WHERE tenant_id = ${id}::uuid`,
    );

    // 4. Appointments & Customers
    await db.execute(
      sql`DELETE FROM advance_applications WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(
      sql`DELETE FROM customer_advances WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(
      sql`DELETE FROM customer_visits WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(sql`DELETE FROM bookings WHERE tenant_id = ${id}::uuid`);

    // 5. Core Entities
    await db.execute(sql`DELETE FROM customers WHERE tenant_id = ${id}::uuid`);
    await db.execute(sql`DELETE FROM products WHERE tenant_id = ${id}::uuid`);
    await db.execute(sql`DELETE FROM services WHERE tenant_id = ${id}::uuid`);
    await db.execute(sql`DELETE FROM staff WHERE tenant_id = ${id}::uuid`);
    await db.execute(sql`DELETE FROM user_roles WHERE tenant_id = ${id}::uuid`);

    // 6. Config & Assets
    await db.execute(
      sql`DELETE FROM tenant_configs WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(sql`DELETE FROM api_keys WHERE tenant_id = ${id}::uuid`);
    await db.execute(sql`DELETE FROM audit_logs WHERE tenant_id = ${id}::uuid`);
    await db.execute(
      sql`DELETE FROM tenant_quotas WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(
      sql`DELETE FROM tenant_holidays WHERE tenant_id = ${id}::uuid`,
    );
    await db.execute(
      sql`DELETE FROM media_assets WHERE tenant_id = ${id}::uuid`,
    );

    // Finally
    await db.execute(sql`DELETE FROM tenants WHERE id = ${id}::uuid`);

    console.log(`Deleted tenant: ${tenant.name}`);
  }

  console.log("Cleanup complete.");
  process.exit(0);
}

deleteTestTenants().catch((err) => {
  console.error("Error deleting tenants:", err);
  process.exit(1);
});
