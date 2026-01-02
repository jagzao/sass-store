import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import * as schema from "../packages/database/schema";

// Load environment variables
dotenv.config();

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Create connection without pooling for migration
const migrationClient = postgres(DATABASE_URL, { max: 1 });

// Create drizzle instance for migrations
const db = drizzle(migrationClient, { schema });

async function applyRLSPolicies() {
  console.log("Applying Row Level Security policies...");

  try {
    // Enable RLS on all multi-tenant tables
    await db.execute(`
      ALTER TABLE products ENABLE ROW LEVEL SECURITY;
      ALTER TABLE services ENABLE ROW LEVEL SECURITY;
      ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
      ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
      ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
      ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
      ALTER TABLE financial_kpis ENABLE ROW LEVEL SECURITY;
      ALTER TABLE financial_movements ENABLE ROW LEVEL SECURITY;
      ALTER TABLE mercadopago_payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE mercadopago_tokens ENABLE ROW LEVEL SECURITY;
      ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE customer_visits ENABLE ROW LEVEL SECURITY;
      ALTER TABLE pos_terminals ENABLE ROW LEVEL SECURITY;
      ALTER TABLE tenant_channels ENABLE ROW LEVEL SECURITY;
      ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
      ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE posting_rules ENABLE ROW LEVEL SECURITY;
      ALTER TABLE post_jobs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE tenant_quotas ENABLE ROW LEVEL SECURITY;
      ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE tenant_configs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
    `);

    console.log("✓ RLS enabled on all multi-tenant tables");

    // Create RLS policies for each table
    await db.execute(`
      -- Products table RLS
      DROP POLICY IF EXISTS tenant_isolation_products_select ON products;
      DROP POLICY IF EXISTS tenant_isolation_products_insert ON products;
      DROP POLICY IF EXISTS tenant_isolation_products_update ON products;
      DROP POLICY IF EXISTS tenant_isolation_products_delete ON products;
      
      CREATE POLICY tenant_isolation_products_select ON products
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_products_insert ON products
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_products_update ON products
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_products_delete ON products
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log("✓ RLS policies applied to products table");

    await db.execute(`
      -- Services table RLS
      DROP POLICY IF EXISTS tenant_isolation_services_select ON services;
      DROP POLICY IF EXISTS tenant_isolation_services_insert ON services;
      DROP POLICY IF EXISTS tenant_isolation_services_update ON services;
      DROP POLICY IF EXISTS tenant_isolation_services_delete ON services;
      
      CREATE POLICY tenant_isolation_services_select ON services
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_services_insert ON services
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_services_update ON services
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_services_delete ON services
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log("✓ RLS policies applied to services table");

    await db.execute(`
      -- Staff table RLS
      DROP POLICY IF EXISTS tenant_isolation_staff_select ON staff;
      DROP POLICY IF EXISTS tenant_isolation_staff_insert ON staff;
      DROP POLICY IF EXISTS tenant_isolation_staff_update ON staff;
      DROP POLICY IF EXISTS tenant_isolation_staff_delete ON staff;
      
      CREATE POLICY tenant_isolation_staff_select ON staff
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_staff_insert ON staff
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_staff_update ON staff
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_staff_delete ON staff
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log("✓ RLS policies applied to staff table");

    await db.execute(`
      -- Bookings table RLS
      DROP POLICY IF EXISTS tenant_isolation_bookings_select ON bookings;
      DROP POLICY IF EXISTS tenant_isolation_bookings_insert ON bookings;
      DROP POLICY IF EXISTS tenant_isolation_bookings_update ON bookings;
      DROP POLICY IF EXISTS tenant_isolation_bookings_delete ON bookings;
      
      CREATE POLICY tenant_isolation_bookings_select ON bookings
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_bookings_insert ON bookings
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_bookings_update ON bookings
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_bookings_delete ON bookings
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log("✓ RLS policies applied to bookings table");

    await db.execute(`
      -- Orders table RLS
      DROP POLICY IF EXISTS tenant_isolation_orders_select ON orders;
      DROP POLICY IF EXISTS tenant_isolation_orders_insert ON orders;
      DROP POLICY IF EXISTS tenant_isolation_orders_update ON orders;
      DROP POLICY IF EXISTS tenant_isolation_orders_delete ON orders;
      
      CREATE POLICY tenant_isolation_orders_select ON orders
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_orders_insert ON orders
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_orders_update ON orders
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_orders_delete ON orders
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log("✓ RLS policies applied to orders table");

    await db.execute(`
      -- Payments table RLS
      DROP POLICY IF EXISTS tenant_isolation_payments_select ON payments;
      DROP POLICY IF EXISTS tenant_isolation_payments_insert ON payments;
      DROP POLICY IF EXISTS tenant_isolation_payments_update ON payments;
      DROP POLICY IF EXISTS tenant_isolation_payments_delete ON payments;
      
      CREATE POLICY tenant_isolation_payments_select ON payments
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_payments_insert ON payments
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_payments_update ON payments
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_payments_delete ON payments
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log("✓ RLS policies applied to payments table");

    await db.execute(`
      -- Campaigns table RLS
      DROP POLICY IF EXISTS tenant_isolation_campaigns_select ON campaigns;
      DROP POLICY IF EXISTS tenant_isolation_campaigns_insert ON campaigns;
      DROP POLICY IF EXISTS tenant_isolation_campaigns_update ON campaigns;
      DROP POLICY IF EXISTS tenant_isolation_campaigns_delete ON campaigns;
      
      CREATE POLICY tenant_isolation_campaigns_select ON campaigns
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_campaigns_insert ON campaigns
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_campaigns_update ON campaigns
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_campaigns_delete ON campaigns
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log("✓ RLS policies applied to campaigns table");

    await db.execute(`
      -- Reels table RLS
      DROP POLICY IF EXISTS tenant_isolation_reels_select ON reels;
      DROP POLICY IF EXISTS tenant_isolation_reels_insert ON reels;
      DROP POLICY IF EXISTS tenant_isolation_reels_update ON reels;
      DROP POLICY IF EXISTS tenant_isolation_reels_delete ON reels;
      
      CREATE POLICY tenant_isolation_reels_select ON reels
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_reels_insert ON reels
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_reels_update ON reels
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_reels_delete ON reels
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log("✓ RLS policies applied to reels table");

    await db.execute(`
      -- Financial KPIs table RLS
      DROP POLICY IF EXISTS tenant_isolation_financial_kpis_select ON financial_kpis;
      DROP POLICY IF EXISTS tenant_isolation_financial_kpis_insert ON financial_kpis;
      DROP POLICY IF EXISTS tenant_isolation_financial_kpis_update ON financial_kpis;
      DROP POLICY IF EXISTS tenant_isolation_financial_kpis_delete ON financial_kpis;
      
      CREATE POLICY tenant_isolation_financial_kpis_select ON financial_kpis
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_financial_kpis_insert ON financial_kpis
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_financial_kpis_update ON financial_kpis
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_financial_kpis_delete ON financial_kpis
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log("✓ RLS policies applied to financial_kpis table");

    await db.execute(`
      -- Financial Movements table RLS
      DROP POLICY IF EXISTS tenant_isolation_financial_movements_select ON financial_movements;
      DROP POLICY IF EXISTS tenant_isolation_financial_movements_insert ON financial_movements;
      DROP POLICY IF EXISTS tenant_isolation_financial_movements_update ON financial_movements;
      DROP POLICY IF EXISTS tenant_isolation_financial_movements_delete ON financial_movements;
      
      CREATE POLICY tenant_isolation_financial_movements_select ON financial_movements
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_financial_movements_insert ON financial_movements
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_financial_movements_update ON financial_movements
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_financial_movements_delete ON financial_movements
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log("✓ RLS policies applied to financial_movements table");

    await db.execute(`
      -- MercadoPago Payments table RLS
      DROP POLICY IF EXISTS tenant_isolation_mercadopago_payments_select ON mercadopago_payments;
      DROP POLICY IF EXISTS tenant_isolation_mercadopago_payments_insert ON mercadopago_payments;
      DROP POLICY IF EXISTS tenant_isolation_mercadopago_payments_update ON mercadopago_payments;
      DROP POLICY IF EXISTS tenant_isolation_mercadopago_payments_delete ON mercadopago_payments;
      
      CREATE POLICY tenant_isolation_mercadopago_payments_select ON mercadopago_payments
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_mercadopago_payments_insert ON mercadopago_payments
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_mercadopago_payments_update ON mercadopago_payments
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_mercadopago_payments_delete ON mercadopago_payments
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);

    console.log("✓ RLS policies applied to mercadopago_payments table");

    await db.execute(`
      -- MercadoPago Tokens table RLS
      DROP POLICY IF EXISTS tenant_isolation_mercadopago_tokens_select ON mercadopago_tokens;
      DROP POLICY IF EXISTS tenant_isolation_mercadopago_tokens_insert ON mercadopago_tokens;
      DROP POLICY IF EXISTS tenant_isolation_mercadopago_tokens_update ON mercadopago_tokens;
      DROP POLICY IF EXISTS tenant_isolation_mercadopago_tokens_delete ON mercadopago_tokens;
      
      CREATE POLICY tenant_isolation_mercadopago_tokens_select ON mercadopago_tokens
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_mercadopago_tokens_insert ON mercadopago_tokens
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_mercadopago_tokens_update ON mercadopago_tokens
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_mercadopago_tokens_delete ON mercadopago_tokens
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);
    console.log("✓ RLS policies applied to mercadopago_tokens table");

    await db.execute(`
      -- Customers table RLS
      DROP POLICY IF EXISTS tenant_isolation_customers_select ON customers;
      DROP POLICY IF EXISTS tenant_isolation_customers_insert ON customers;
      DROP POLICY IF EXISTS tenant_isolation_customers_update ON customers;
      DROP POLICY IF EXISTS tenant_isolation_customers_delete ON customers;
      
      CREATE POLICY tenant_isolation_customers_select ON customers
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_customers_insert ON customers
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_customers_update ON customers
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_customers_delete ON customers
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);
    console.log("✓ RLS policies applied to customers table");

    await db.execute(`
      -- Customer Visits table RLS
      DROP POLICY IF EXISTS tenant_isolation_customer_visits_select ON customer_visits;
      DROP POLICY IF EXISTS tenant_isolation_customer_visits_insert ON customer_visits;
      DROP POLICY IF EXISTS tenant_isolation_customer_visits_update ON customer_visits;
      DROP POLICY IF EXISTS tenant_isolation_customer_visits_delete ON customer_visits;
      
      CREATE POLICY tenant_isolation_customer_visits_select ON customer_visits
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_customer_visits_insert ON customer_visits
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_customer_visits_update ON customer_visits
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_customer_visits_delete ON customer_visits
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);
    console.log("✓ RLS policies applied to customer_visits table");

    await db.execute(`
      -- POS Terminals table RLS
      DROP POLICY IF EXISTS tenant_isolation_pos_terminals_select ON pos_terminals;
      DROP POLICY IF EXISTS tenant_isolation_pos_terminals_insert ON pos_terminals;
      DROP POLICY IF EXISTS tenant_isolation_pos_terminals_update ON pos_terminals;
      DROP POLICY IF EXISTS tenant_isolation_pos_terminals_delete ON pos_terminals;

      CREATE POLICY tenant_isolation_pos_terminals_select ON pos_terminals
        FOR SELECT
        USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

      CREATE POLICY tenant_isolation_pos_terminals_insert ON pos_terminals
        FOR INSERT
        WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

      CREATE POLICY tenant_isolation_pos_terminals_update ON pos_terminals
        FOR UPDATE
        USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
        WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

      CREATE POLICY tenant_isolation_pos_terminals_delete ON pos_terminals
        FOR DELETE
        USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));
    `);
    console.log("✓ RLS policies applied to pos_terminals table");

    await db.execute(`
      -- Tenant Channels table RLS
      DROP POLICY IF EXISTS tenant_isolation_tenant_channels_select ON tenant_channels;
      DROP POLICY IF EXISTS tenant_isolation_tenant_channels_insert ON tenant_channels;
      DROP POLICY IF EXISTS tenant_isolation_tenant_channels_update ON tenant_channels;
      DROP POLICY IF EXISTS tenant_isolation_tenant_channels_delete ON tenant_channels;
      
      CREATE POLICY tenant_isolation_tenant_channels_select ON tenant_channels
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_tenant_channels_insert ON tenant_channels
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_tenant_channels_update ON tenant_channels
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_tenant_channels_delete ON tenant_channels
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);
    console.log("✓ RLS policies applied to tenant_channels table");

    await db.execute(`
      -- Media Assets table RLS
      DROP POLICY IF EXISTS tenant_isolation_media_assets_select ON media_assets;
      DROP POLICY IF EXISTS tenant_isolation_media_assets_insert ON media_assets;
      DROP POLICY IF EXISTS tenant_isolation_media_assets_update ON media_assets;
      DROP POLICY IF EXISTS tenant_isolation_media_assets_delete ON media_assets;
      
      CREATE POLICY tenant_isolation_media_assets_select ON media_assets
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_media_assets_insert ON media_assets
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_media_assets_update ON media_assets
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_media_assets_delete ON media_assets
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);
    console.log("✓ RLS policies applied to media_assets table");

    await db.execute(`
      -- Social Posts table RLS
      DROP POLICY IF EXISTS tenant_isolation_social_posts_select ON social_posts;
      DROP POLICY IF EXISTS tenant_isolation_social_posts_insert ON social_posts;
      DROP POLICY IF EXISTS tenant_isolation_social_posts_update ON social_posts;
      DROP POLICY IF EXISTS tenant_isolation_social_posts_delete ON social_posts;
      
      CREATE POLICY tenant_isolation_social_posts_select ON social_posts
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_social_posts_insert ON social_posts
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_social_posts_update ON social_posts
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_social_posts_delete ON social_posts
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);
    console.log("✓ RLS policies applied to social_posts table");

    await db.execute(`
      -- Posting Rules table RLS
      DROP POLICY IF EXISTS tenant_isolation_posting_rules_select ON posting_rules;
      DROP POLICY IF EXISTS tenant_isolation_posting_rules_insert ON posting_rules;
      DROP POLICY IF EXISTS tenant_isolation_posting_rules_update ON posting_rules;
      DROP POLICY IF EXISTS tenant_isolation_posting_rules_delete ON posting_rules;
      
      CREATE POLICY tenant_isolation_posting_rules_select ON posting_rules
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_posting_rules_insert ON posting_rules
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_posting_rules_update ON posting_rules
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_posting_rules_delete ON posting_rules
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);
    console.log("✓ RLS policies applied to posting_rules table");

    await db.execute(`
      -- Post Jobs table RLS
      DROP POLICY IF EXISTS tenant_isolation_post_jobs_select ON post_jobs;
      DROP POLICY IF EXISTS tenant_isolation_post_jobs_insert ON post_jobs;
      DROP POLICY IF EXISTS tenant_isolation_post_jobs_update ON post_jobs;
      DROP POLICY IF EXISTS tenant_isolation_post_jobs_delete ON post_jobs;
      
      CREATE POLICY tenant_isolation_post_jobs_select ON post_jobs
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_post_jobs_insert ON post_jobs
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_post_jobs_update ON post_jobs
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_post_jobs_delete ON post_jobs
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);
    console.log("✓ RLS policies applied to post_jobs table");

    await db.execute(`
      -- Tenant Quotas table RLS
      DROP POLICY IF EXISTS tenant_isolation_tenant_quotas_select ON tenant_quotas;
      DROP POLICY IF EXISTS tenant_isolation_tenant_quotas_insert ON tenant_quotas;
      DROP POLICY IF EXISTS tenant_isolation_tenant_quotas_update ON tenant_quotas;
      DROP POLICY IF EXISTS tenant_isolation_tenant_quotas_delete ON tenant_quotas;
      
      CREATE POLICY tenant_isolation_tenant_quotas_select ON tenant_quotas
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_tenant_quotas_insert ON tenant_quotas
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_tenant_quotas_update ON tenant_quotas
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_tenant_quotas_delete ON tenant_quotas
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);
    console.log("✓ RLS policies applied to tenant_quotas table");

    await db.execute(`
      -- Audit Logs table RLS
      DROP POLICY IF EXISTS tenant_isolation_audit_logs_select ON audit_logs;
      DROP POLICY IF EXISTS tenant_isolation_audit_logs_insert ON audit_logs;
      DROP POLICY IF EXISTS tenant_isolation_audit_logs_update ON audit_logs;
      DROP POLICY IF EXISTS tenant_isolation_audit_logs_delete ON audit_logs;
      
      CREATE POLICY tenant_isolation_audit_logs_select ON audit_logs
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_audit_logs_insert ON audit_logs
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_audit_logs_update ON audit_logs
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_audit_logs_delete ON audit_logs
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);
    console.log("✓ RLS policies applied to audit_logs table");

    await db.execute(`
      -- Tenant Configs table RLS
      DROP POLICY IF EXISTS tenant_isolation_tenant_configs_select ON tenant_configs;
      DROP POLICY IF EXISTS tenant_isolation_tenant_configs_insert ON tenant_configs;
      DROP POLICY IF EXISTS tenant_isolation_tenant_configs_update ON tenant_configs;
      DROP POLICY IF EXISTS tenant_isolation_tenant_configs_delete ON tenant_configs;
      
      CREATE POLICY tenant_isolation_tenant_configs_select ON tenant_configs
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_tenant_configs_insert ON tenant_configs
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_tenant_configs_update ON tenant_configs
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_tenant_configs_delete ON tenant_configs
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);
    console.log("✓ RLS policies applied to tenant_configs table");

    await db.execute(`
      -- API Keys table RLS
      DROP POLICY IF EXISTS tenant_isolation_api_keys_select ON api_keys;
      DROP POLICY IF EXISTS tenant_isolation_api_keys_insert ON api_keys;
      DROP POLICY IF EXISTS tenant_isolation_api_keys_update ON api_keys;
      DROP POLICY IF EXISTS tenant_isolation_api_keys_delete ON api_keys;
      
      CREATE POLICY tenant_isolation_api_keys_select ON api_keys
        FOR SELECT
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_api_keys_insert ON api_keys
        FOR INSERT
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_api_keys_update ON api_keys
        FOR UPDATE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
      
      CREATE POLICY tenant_isolation_api_keys_delete ON api_keys
        FOR DELETE
        USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);
    `);
    console.log("✓ RLS policies applied to api_keys table");

    // Create helper functions
    await db.execute(`
      -- Helper Function: Set Tenant Context
      CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid uuid)
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.current_tenant_id', tenant_uuid::text, FALSE);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Helper Function: Get Current Tenant
      CREATE OR REPLACE FUNCTION get_current_tenant()
      RETURNS uuid AS $$
      BEGIN
        RETURN current_setting('app.current_tenant_id', TRUE)::uuid;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      -- SECURITY FIX: Set search_path for update_updated_at_column
      -- This fixes the "Function Search Path Mutable" warning
      ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

      -- SECURITY FIX: Set search_path for RLS helper functions
      ALTER FUNCTION public.get_current_tenant_id() SET search_path = public;
      ALTER FUNCTION public.set_tenant_context(uuid) SET search_path = public;
      ALTER FUNCTION public.get_current_tenant() SET search_path = public;
      ALTER FUNCTION public.is_subscription_valid(uuid) SET search_path = public;
    `);

    console.log("✓ Helper functions created");

    console.log("\n✅ All RLS policies have been successfully applied!");
    console.log("\nIMPORTANT: Make sure to run the database migrations first:");
    console.log("  npm run db:push");
    console.log("\nThen seed your database:");
    console.log("  npm run db:seed");
    console.log("\nThe tenants should be working after these steps.");
  } catch (error) {
    console.error("❌ Error applying RLS policies:", error);
    throw error;
  } finally {
    // Close the connection
    await migrationClient.end();
  }
}

// Run the function if called directly
if (require.main === module) {
  applyRLSPolicies().catch(console.error);
}

export { applyRLSPolicies };
