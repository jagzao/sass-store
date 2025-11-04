-- Social Planner Schema for Multitenant SaaS
-- Tables: social_posts, social_post_targets
-- Views: v_social_calendar, v_social_schedule

-- Create social_posts table
CREATE TABLE social_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT,
    base_text TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'canceled')),
    scheduled_at_utc TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_post_targets table (1:N relationship)
CREATE TABLE social_post_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'x', 'tiktok', 'gbp', 'threads')),
    publish_at_utc TIMESTAMP WITH TIME ZONE,
    variant_text TEXT,
    asset_ids JSONB DEFAULT '[]', -- Array of media asset IDs
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'canceled')),
    external_ref VARCHAR(255), -- Reference to external platform post ID
    error TEXT, -- Error message if publication failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_social_posts_tenant_id ON social_posts(tenant_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled_at ON social_posts(scheduled_at_utc);
CREATE INDEX idx_social_posts_created_at ON social_posts(created_at);

CREATE INDEX idx_social_post_targets_post_id ON social_post_targets(post_id);
CREATE INDEX idx_social_post_targets_platform ON social_post_targets(platform);
CREATE INDEX idx_social_post_targets_status ON social_post_targets(status);
CREATE INDEX idx_social_post_targets_publish_at ON social_post_targets(publish_at_utc);

-- Create composite indexes for common queries
CREATE INDEX idx_social_posts_tenant_status ON social_posts(tenant_id, status);
CREATE INDEX idx_social_posts_tenant_date_range ON social_posts(tenant_id, scheduled_at_utc);
CREATE INDEX idx_social_post_targets_platform_status ON social_post_targets(platform, status);

-- Create view for calendar aggregation
CREATE OR REPLACE VIEW v_social_calendar AS
SELECT
    p.tenant_id,
    DATE(p.scheduled_at_utc AT TIME ZONE p.timezone) as date,
    COUNT(*) as post_count,
    ARRAY_AGG(DISTINCT p.status) as statuses,
    ARRAY_AGG(DISTINCT t.platform) as platforms,
    COUNT(CASE WHEN p.status = 'draft' THEN 1 END) as draft_count,
    COUNT(CASE WHEN p.status = 'scheduled' THEN 1 END) as scheduled_count,
    COUNT(CASE WHEN p.status = 'published' THEN 1 END) as published_count,
    COUNT(CASE WHEN p.status = 'failed' THEN 1 END) as failed_count
FROM social_posts p
LEFT JOIN social_post_targets t ON p.id = t.post_id
WHERE p.scheduled_at_utc IS NOT NULL
GROUP BY p.tenant_id, DATE(p.scheduled_at_utc AT TIME ZONE p.timezone);

-- Create view for schedule overview
CREATE OR REPLACE VIEW v_social_schedule AS
SELECT
    p.tenant_id,
    p.id as post_id,
    t.id as target_id,
    p.title,
    p.base_text,
    t.platform,
    COALESCE(t.publish_at_utc, p.scheduled_at_utc) as publish_at_utc,
    p.timezone,
    t.status as target_status,
    p.status as post_status,
    t.variant_text,
    t.asset_ids,
    p.created_at,
    p.updated_at
FROM social_posts p
LEFT JOIN social_post_targets t ON p.id = t.post_id
ORDER BY COALESCE(t.publish_at_utc, p.scheduled_at_utc) ASC;

-- Enable RLS on tables
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_targets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY "Social posts are viewable by tenant" ON social_posts FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "Social posts are insertable by tenant" ON social_posts FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "Social posts are updatable by tenant" ON social_posts FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "Social posts are deletable by tenant" ON social_posts FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Social post targets are viewable by tenant" ON social_post_targets FOR SELECT USING (
    post_id IN (SELECT id FROM social_posts WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid)
);
CREATE POLICY "Social post targets are insertable by tenant" ON social_post_targets FOR INSERT WITH CHECK (
    post_id IN (SELECT id FROM social_posts WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid)
);
CREATE POLICY "Social post targets are updatable by tenant" ON social_post_targets FOR UPDATE USING (
    post_id IN (SELECT id FROM social_posts WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid)
);
CREATE POLICY "Social post targets are deletable by tenant" ON social_post_targets FOR DELETE USING (
    post_id IN (SELECT id FROM social_posts WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid)
);

-- Insert some seed data for testing
DO $$
DECLARE
    wondernails_id UUID;
    vigi_id UUID;
    post_id UUID;
BEGIN
    -- Get tenant IDs
    SELECT id INTO wondernails_id FROM tenants WHERE slug = 'wondernails';
    SELECT id INTO vigi_id FROM tenants WHERE slug = 'vigistudio';

    -- Insert sample social posts for wondernails
    INSERT INTO social_posts (tenant_id, title, base_text, status, scheduled_at_utc, timezone, created_by) VALUES
    (wondernails_id, 'New Gel Manicure Collection', 'Check out our stunning new gel manicure colors! Perfect for any occasion. Book your appointment today! 💅✨', 'scheduled', NOW() + INTERVAL '2 hours', 'America/Los_Angeles', 'admin@wondernails.local'),
    (wondernails_id, 'Weekend Special Offer', 'Weekend vibes call for perfect nails! Get 20% off all services this Saturday and Sunday. Limited spots available!', 'draft', NULL, 'America/Los_Angeles', 'admin@wondernails.local'),
    (wondernails_id, 'Client Showcase', 'Amazing nail art by our talented team! Thank you for trusting us with your style 🎨', 'published', NOW() - INTERVAL '1 day', 'America/Los_Angeles', 'admin@wondernails.local');

    -- Insert sample social posts for vigistudio
    INSERT INTO social_posts (tenant_id, title, base_text, status, scheduled_at_utc, timezone, created_by) VALUES
    (vigi_id, 'Hair Transformation Tuesday', 'From dull to dazzling! Our color specialists work magic every day. Book your transformation consultation today! ✂️', 'scheduled', NOW() + INTERVAL '6 hours', 'America/Los_Angeles', 'admin@vigistudio.local');

    -- Get the first post ID for targets
    SELECT id INTO post_id FROM social_posts WHERE tenant_id = wondernails_id AND title = 'New Gel Manicure Collection';

    -- Insert social post targets
    INSERT INTO social_post_targets (post_id, platform, variant_text, asset_ids, status) VALUES
    (post_id, 'instagram', 'Check out our stunning new gel manicure colors! Perfect for any occasion. Book your appointment today! 💅✨ #GelManicure #NailArt #WonderNails', '[]', 'scheduled'),
    (post_id, 'facebook', 'New Gel Manicure Collection now available! Our latest colors are perfect for any occasion. Book your appointment today and let our expert technicians create the perfect look for you!', '[]', 'scheduled'),
    (post_id, 'x', 'New gel manicure colors are here! 💅 Book now at Wonder Nails. Limited time offer! #Nails #Beauty', '[]', 'scheduled');

    RAISE NOTICE 'Social planner seed data inserted successfully!';
END $$;

SELECT 'Social Planner schema and seed data deployed successfully!' as message;