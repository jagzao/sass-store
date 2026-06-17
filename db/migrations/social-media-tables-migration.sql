-- Social Media Tables Migration for Supabase
-- Execute this in Supabase SQL Editor if the tables don't exist yet

-- Check if tables exist, if so, skip creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_posts') THEN
        -- Create social_posts table
        CREATE TABLE social_posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id),
            title VARCHAR(200),
            base_text TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft' | 'scheduled' | 'published' | 'failed' | 'canceled'
            scheduled_at_utc TIMESTAMP,
            timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
            created_by VARCHAR(100) NOT NULL DEFAULT 'system',
            updated_by VARCHAR(100) NOT NULL DEFAULT 'system',
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes for social_posts
        CREATE INDEX idx_social_posts_tenant_id ON social_posts(tenant_id);
        CREATE INDEX idx_social_posts_status ON social_posts(status);
        CREATE INDEX idx_social_posts_scheduled_at ON social_posts(scheduled_at_utc);
        CREATE INDEX idx_social_posts_created_at ON social_posts(created_at);
        CREATE INDEX idx_social_posts_tenant_status ON social_posts(tenant_id, status);
        CREATE INDEX idx_social_posts_tenant_date_range ON social_posts(tenant_id, scheduled_at_utc);

        RAISE NOTICE 'Table social_posts created successfully';
    ELSE
        RAISE NOTICE 'Table social_posts already exists, skipping';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_post_targets') THEN
        -- Create social_post_targets table
        CREATE TABLE social_post_targets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
            platform VARCHAR(50) NOT NULL, -- 'facebook' | 'instagram' | 'linkedin' | 'x' | 'tiktok' | 'gbp' | 'threads'
            publish_at_utc TIMESTAMP,
            timezone VARCHAR(100) NOT NULL DEFAULT 'America/Mexico_City',
            status VARCHAR(20) NOT NULL DEFAULT 'draft',
            variant_text TEXT,
            platform_post_id VARCHAR(255),
            external_ref VARCHAR(255),
            error TEXT,
            asset_ids JSONB NOT NULL DEFAULT '[]',
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes for social_post_targets
        CREATE INDEX idx_social_post_targets_post_id ON social_post_targets(post_id);
        CREATE INDEX idx_social_post_targets_platform ON social_post_targets(platform);
        CREATE INDEX idx_social_post_targets_status ON social_post_targets(status);
        CREATE INDEX idx_social_post_targets_publish_at ON social_post_targets(publish_at_utc);
        CREATE INDEX idx_social_post_targets_platform_status ON social_post_targets(platform, status);

        RAISE NOTICE 'Table social_post_targets created successfully';
    ELSE
        RAISE NOTICE 'Table social_post_targets already exists, skipping';
    END IF;
END $$;

-- Verify tables were created
SELECT
    'social_posts' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'social_posts'
UNION ALL
SELECT
    'social_post_targets' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'social_post_targets';
