-- ========================================================================
-- 🚀 COPIAR Y PEGAR ESTE SQL EN SUPABASE
-- ========================================================================
-- URL: https://supabase.com/dashboard/project/jedryjmljffuvegggjmw/sql/new
-- Instrucciones:
-- 1. Copia TODO este contenido (Ctrl+A, Ctrl+C)
-- 2. Pégalo en el SQL Editor de Supabase
-- 3. Click en "Run" (botón verde)
-- 4. Verifica los resultados al final
-- ========================================================================

-- ========================================================================
-- 1. CREATE CAMPAIGNS TABLE
-- ========================================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    slug TEXT NOT NULL,
    lut_file TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT campaigns_tenant_slug_unique UNIQUE(tenant_id, slug)
);

-- Create indexes for campaigns
CREATE INDEX IF NOT EXISTS campaigns_tenant_idx ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS campaigns_slug_idx ON campaigns(slug);
CREATE INDEX IF NOT EXISTS campaigns_type_idx ON campaigns(type);

-- ========================================================================
-- 2. CREATE REELS TABLE
-- ========================================================================

CREATE TABLE IF NOT EXISTS reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    overlay_type TEXT NOT NULL,
    music_file TEXT NOT NULL,
    duration NUMERIC(10,2) DEFAULT 0,
    hashtags TEXT[] DEFAULT '{}',
    caption TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for reels
CREATE INDEX IF NOT EXISTS reels_tenant_idx ON reels(tenant_id);
CREATE INDEX IF NOT EXISTS reels_campaign_idx ON reels(campaign_id);
CREATE INDEX IF NOT EXISTS reels_status_idx ON reels(status);
CREATE INDEX IF NOT EXISTS reels_created_idx ON reels(created_at DESC);

-- ========================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ========================================================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

-- ========================================================================
-- 4. DROP EXISTING POLICIES (if any)
-- ========================================================================

DROP POLICY IF EXISTS "campaigns_service_role_all" ON campaigns;
DROP POLICY IF EXISTS "campaigns_authenticated_all" ON campaigns;
DROP POLICY IF EXISTS "campaigns_anon_read" ON campaigns;
DROP POLICY IF EXISTS "reels_service_role_all" ON reels;
DROP POLICY IF EXISTS "reels_authenticated_all" ON reels;
DROP POLICY IF EXISTS "reels_anon_read" ON reels;

-- ========================================================================
-- 5. CREATE RLS POLICIES FOR CAMPAIGNS
-- ========================================================================

-- Service role has full access
CREATE POLICY "campaigns_service_role_all"
ON campaigns
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can do everything (tenant isolation handled at app level)
CREATE POLICY "campaigns_authenticated_all"
ON campaigns
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Anonymous users can read campaigns
CREATE POLICY "campaigns_anon_read"
ON campaigns
FOR SELECT
TO anon
USING (true);

-- ========================================================================
-- 6. CREATE RLS POLICIES FOR REELS
-- ========================================================================

-- Service role has full access
CREATE POLICY "reels_service_role_all"
ON reels
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can do everything (tenant isolation handled at app level)
CREATE POLICY "reels_authenticated_all"
ON reels
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Anonymous users can read reels
CREATE POLICY "reels_anon_read"
ON reels
FOR SELECT
TO anon
USING (true);

-- ========================================================================
-- 7. CREATE UPDATE TRIGGERS FOR updated_at
-- ========================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for campaigns
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for reels
DROP TRIGGER IF EXISTS update_reels_updated_at ON reels;
CREATE TRIGGER update_reels_updated_at
    BEFORE UPDATE ON reels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================
-- 8. INSERT INITIAL CAMPAIGNS FOR WONDERNAILS
-- ========================================================================

-- WonderNails Tenant ID: 3da221b3-d5f8-4c33-996a-b46b68843d99

-- Campaña de Belleza
INSERT INTO campaigns (tenant_id, name, type, slug, lut_file, created_at, updated_at)
VALUES (
    '3da221b3-d5f8-4c33-996a-b46b68843d99',
    'Belleza WonderNails',
    'belleza',
    'belleza-wondernails',
    'assets/luts/zo-system/belleza_warm.cube',
    now(),
    now()
)
ON CONFLICT (tenant_id, slug) DO UPDATE
SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    lut_file = EXCLUDED.lut_file,
    updated_at = now();

-- Campaña de Navidad
INSERT INTO campaigns (tenant_id, name, type, slug, lut_file, created_at, updated_at)
VALUES (
    '3da221b3-d5f8-4c33-996a-b46b68843d99',
    'Navidad WonderNails',
    'navidad',
    'navidad-wondernails',
    'assets/luts/zo-system/navidad_gold.cube',
    now(),
    now()
)
ON CONFLICT (tenant_id, slug) DO UPDATE
SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    lut_file = EXCLUDED.lut_file,
    updated_at = now();

-- Campaña Promocional
INSERT INTO campaigns (tenant_id, name, type, slug, lut_file, created_at, updated_at)
VALUES (
    '3da221b3-d5f8-4c33-996a-b46b68843d99',
    'Promociones WonderNails',
    'promocional',
    'promocional-wondernails',
    'assets/luts/HardBoost.cube',
    now(),
    now()
)
ON CONFLICT (tenant_id, slug) DO UPDATE
SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    lut_file = EXCLUDED.lut_file,
    updated_at = now();

-- Campaña de Verano
INSERT INTO campaigns (tenant_id, name, type, slug, lut_file, created_at, updated_at)
VALUES (
    '3da221b3-d5f8-4c33-996a-b46b68843d99',
    'Verano WonderNails',
    'verano',
    'verano-wondernails',
    'assets/luts/BlueHour.cube',
    now(),
    now()
)
ON CONFLICT (tenant_id, slug) DO UPDATE
SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    lut_file = EXCLUDED.lut_file,
    updated_at = now();

-- ========================================================================
-- 9. VERIFICATION QUERIES - Verás estos resultados al ejecutar
-- ========================================================================

-- Verify campaigns were created
SELECT
    id,
    name,
    type,
    slug,
    lut_file,
    created_at
FROM campaigns
WHERE tenant_id = '3da221b3-d5f8-4c33-996a-b46b68843d99'
ORDER BY name;

-- Count reels (should be 0 initially)
SELECT COUNT(*) as total_reels
FROM reels
WHERE tenant_id = '3da221b3-d5f8-4c33-996a-b46b68843d99';

-- ========================================================================
-- ✅ VERIFICACIÓN FINAL
-- ========================================================================
-- Si ves 4 campañas listadas arriba, ¡todo funcionó correctamente! 🎉
-- ========================================================================
