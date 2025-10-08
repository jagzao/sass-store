import postgres from "postgres";

async function applySchema() {
  const connectionString = process.env.DATABASE_URL!;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString, {
    prepare: false,
    ssl: "require",
  });

  try {
    console.log("🔨 Applying database schema...");

    // Drop all tables to start fresh
    await client.unsafe(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);

    console.log("✅ Schema reset complete");

    // Create all tables from schema
    const createTablesSQL = `
      -- Tenants table
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        mode VARCHAR(20) NOT NULL DEFAULT 'catalog',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        branding JSONB NOT NULL,
        contact JSONB NOT NULL,
        location JSONB NOT NULL,
        quotas JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX tenant_slug_idx ON tenants(slug);
      CREATE INDEX tenant_status_idx ON tenants(status);

      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        sku VARCHAR(50) NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        featured BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX product_tenant_sku_idx ON products(tenant_id, sku);
      CREATE INDEX product_tenant_idx ON products(tenant_id);
      CREATE INDEX product_category_idx ON products(category);
      CREATE INDEX product_featured_idx ON products(featured);

      -- Services table
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        duration INTEGER NOT NULL,
        featured BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX service_tenant_idx ON services(tenant_id);
      CREATE INDEX service_featured_idx ON services(featured);

      -- Staff table
      CREATE TABLE IF NOT EXISTS staff (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        specialties JSONB NOT NULL DEFAULT '[]',
        photo TEXT,
        google_calendar_id VARCHAR(255),
        active BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX staff_tenant_idx ON staff(tenant_id);
      CREATE INDEX staff_email_idx ON staff(email);

      -- Bookings table
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        service_id UUID NOT NULL REFERENCES services(id),
        staff_id UUID REFERENCES staff(id),
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        notes TEXT,
        total_price DECIMAL(10, 2) NOT NULL,
        google_event_id VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX booking_tenant_idx ON bookings(tenant_id);
      CREATE INDEX booking_service_idx ON bookings(service_id);
      CREATE INDEX booking_staff_idx ON bookings(staff_id);
      CREATE INDEX booking_time_idx ON bookings(start_time);
      CREATE INDEX booking_status_idx ON bookings(status);

      -- Orders table
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        order_number VARCHAR(100) UNIQUE NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        type VARCHAR(20) NOT NULL DEFAULT 'purchase',
        total DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX order_tenant_idx ON orders(tenant_id);
      CREATE UNIQUE INDEX order_number_idx ON orders(order_number);
      CREATE INDEX order_status_idx ON orders(status);
      CREATE INDEX order_created_idx ON orders(created_at);

      -- Order Items table
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id),
        type VARCHAR(20) NOT NULL,
        name VARCHAR(200) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX order_item_order_idx ON order_items(order_id);

      -- Media Assets table
      CREATE TABLE IF NOT EXISTS media_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        asset_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100),
        filename VARCHAR(255) NOT NULL,
        content_hash VARCHAR(64) UNIQUE NOT NULL,
        original_size BIGINT NOT NULL,
        total_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        width INTEGER,
        height INTEGER,
        dominant_color VARCHAR(7),
        blurhash VARCHAR(255),
        variants JSONB NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX media_tenant_type_idx ON media_assets(tenant_id, asset_type);
      CREATE INDEX media_entity_idx ON media_assets(tenant_id, entity_id);
      CREATE UNIQUE INDEX media_hash_idx ON media_assets(content_hash);

      -- Tenant Quotas table
      CREATE TABLE IF NOT EXISTS tenant_quotas (
        tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
        storage_used_bytes BIGINT DEFAULT 0,
        storage_limit_bytes BIGINT DEFAULT 5368709120,
        media_count INTEGER DEFAULT 0,
        media_limit INTEGER DEFAULT 1000,
        bandwidth_used_bytes BIGINT DEFAULT 0,
        bandwidth_limit_bytes BIGINT DEFAULT 53687091200,
        reset_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Payments table
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        stripe_payment_intent_id VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        paid_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX payment_order_idx ON payments(order_id);
      CREATE INDEX payment_tenant_idx ON payments(tenant_id);
      CREATE INDEX payment_stripe_idx ON payments(stripe_payment_intent_id);

      -- Audit Logs table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        user_id VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255),
        changes JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX audit_tenant_idx ON audit_logs(tenant_id);
      CREATE INDEX audit_action_idx ON audit_logs(action);
      CREATE INDEX audit_created_idx ON audit_logs(created_at);

      -- Social Posts table
      CREATE TABLE IF NOT EXISTS social_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        title TEXT,
        base_text TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        scheduled_at_utc TIMESTAMP WITH TIME ZONE,
        timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_social_posts_tenant_id ON social_posts(tenant_id);
      CREATE INDEX idx_social_posts_status ON social_posts(status);
      CREATE INDEX idx_social_posts_scheduled_at ON social_posts(scheduled_at_utc);
      CREATE INDEX idx_social_posts_created_at ON social_posts(created_at);
      CREATE INDEX idx_social_posts_tenant_status ON social_posts(tenant_id, status);
      CREATE INDEX idx_social_posts_tenant_date_range ON social_posts(tenant_id, scheduled_at_utc);

      -- Social Post Targets table
      CREATE TABLE IF NOT EXISTS social_post_targets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
        platform VARCHAR(20) NOT NULL,
        publish_at_utc TIMESTAMP WITH TIME ZONE,
        variant_text TEXT,
        asset_ids JSONB DEFAULT '[]',
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        external_ref VARCHAR(255),
        error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_social_post_targets_post_id ON social_post_targets(post_id);
      CREATE INDEX idx_social_post_targets_platform ON social_post_targets(platform);
      CREATE INDEX idx_social_post_targets_status ON social_post_targets(status);
      CREATE INDEX idx_social_post_targets_publish_at ON social_post_targets(publish_at_utc);
      CREATE INDEX idx_social_post_targets_platform_status ON social_post_targets(platform, status);

      -- NextAuth.js tables
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        email_verified TIMESTAMP,
        image TEXT,
        password TEXT,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX accounts_user_id_idx ON accounts(user_id);
      CREATE INDEX accounts_provider_idx ON accounts(provider);
      CREATE INDEX accounts_provider_account_id_idx ON accounts(provider_account_id);

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        session_token TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX sessions_user_id_idx ON sessions(user_id);
      CREATE INDEX sessions_session_token_idx ON sessions(session_token);

      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX verification_tokens_token_idx ON verification_tokens(token);
      CREATE INDEX verification_tokens_identifier_idx ON verification_tokens(identifier);

      -- Product Reviews table
      CREATE TABLE IF NOT EXISTS product_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id),
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(255),
        rating INTEGER NOT NULL,
        title VARCHAR(200),
        comment TEXT,
        verified BOOLEAN DEFAULT false,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        helpful INTEGER DEFAULT 0,
        reported INTEGER DEFAULT 0,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX review_tenant_idx ON product_reviews(tenant_id);
      CREATE INDEX review_product_idx ON product_reviews(product_id);
      CREATE INDEX review_user_idx ON product_reviews(user_id);
      CREATE INDEX review_rating_idx ON product_reviews(rating);
      CREATE INDEX review_status_idx ON product_reviews(status);
      CREATE INDEX review_created_idx ON product_reviews(created_at);
      CREATE INDEX review_product_status_idx ON product_reviews(product_id, status);
    `;

    await client.unsafe(createTablesSQL);

    console.log("✅ All tables created successfully!");
  } catch (error) {
    console.error("❌ Error applying schema:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();
