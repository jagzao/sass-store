-- MIGRACIÓN: Módulo de Redes Sociales y Analytics (Versión Simplificada)
-- CREADO: 2025-12-24
-- PROPÓSITO: Crear solo las tablas básicas necesarias para el módulo social

-- Establecer schema public
SET search_path TO public;

-- ========================================================================
-- 1. TABLAS PRINCIPALES DEL MÓDULO SOCIAL
-- ========================================================================

-- Tabla de posts sociales
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title_internal VARCHAR(255) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'scheduled', 'published', 'failed')),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    format VARCHAR(20) DEFAULT 'post' CHECK (format IN ('post', 'reel', 'story', 'video')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de variantes de contenido por plataforma
CREATE TABLE IF NOT EXISTS social_post_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    platform VARCHAR(10) NOT NULL CHECK (platform IN ('IG', 'FB', 'TT', 'YT', 'LI', 'GH')),
    content TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'carousel', 'none')),
    hashtags TEXT[] DEFAULT '{}',
    mentions TEXT[] DEFAULT '{}',
    external_id TEXT,
    permalink TEXT,
    engagement_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de plataformas habilitadas por tenant
CREATE TABLE IF NOT EXISTS tenant_social_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(10) NOT NULL CHECK (platform IN ('IG', 'FB', 'TT', 'YT', 'LI', 'GH')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    connected BOOLEAN NOT NULL DEFAULT false,
    daily_limit INTEGER NOT NULL DEFAULT 1,
    posting_window JSONB DEFAULT '{"start": "09:00", "end": "21:00"}',
    default_hashtags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de biblioteca de contenido reutilizable
CREATE TABLE IF NOT EXISTS social_content_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'carousel', 'none')),
    platforms VARCHAR(10)[] DEFAULT '{}',
    category VARCHAR(50) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_template BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de analytics de publicaciones
CREATE TABLE IF NOT EXISTS social_post_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    platform VARCHAR(10) NOT NULL,
    metric_date DATE NOT NULL,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    new_followers INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================================
-- 2. ÍNDICES BÁSICOS
-- ========================================================================

CREATE INDEX IF NOT EXISTS idx_social_posts_tenant_id ON social_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_at ON social_posts(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_social_post_variants_post_id ON social_post_variants(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_variants_platform ON social_post_variants(platform);

CREATE INDEX IF NOT EXISTS idx_tenant_social_platforms_tenant_id ON tenant_social_platforms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_social_platforms_platform ON tenant_social_platforms(platform);

CREATE INDEX IF NOT EXISTS idx_social_content_library_tenant_id ON social_content_library(tenant_id);

CREATE INDEX IF NOT EXISTS idx_social_post_analytics_post_id ON social_post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_analytics_platform ON social_post_analytics(platform);

-- ========================================================================
-- 3. DATOS INICIALES PARA PRUEBAS
-- ========================================================================

-- Insertar plataformas sociales para tenants existentes
INSERT INTO tenant_social_platforms (tenant_id, platform, enabled, daily_limit)
SELECT t.id, 'IG', true, 3
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_social_platforms tsp 
    WHERE tsp.tenant_id = t.id AND tsp.platform = 'IG'
);

INSERT INTO tenant_social_platforms (tenant_id, platform, enabled, daily_limit)
SELECT t.id, 'FB', true, 2
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_social_platforms tsp 
    WHERE tsp.tenant_id = t.id AND tsp.platform = 'FB'
);

INSERT INTO tenant_social_platforms (tenant_id, platform, enabled, daily_limit)
SELECT t.id, 'TT', false, 1
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_social_platforms tsp 
    WHERE tsp.tenant_id = t.id AND tsp.platform = 'TT'
);

-- Insertar contenido de ejemplo en la biblioteca
INSERT INTO social_content_library (tenant_id, title, content, category, tags, is_template)
SELECT t.id, 'Promoción de Servicios', '¡Descubre nuestros increíbles servicios! ✨ Calidad profesional con un toque personal. #WonderNails #Belleza', 'promocion', ARRAY['servicios', 'belleza', 'promocion'], true
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM social_content_library scl 
    WHERE scl.tenant_id = t.id AND scl.title = 'Promoción de Servicios'
);

INSERT INTO social_content_library (tenant_id, title, content, category, tags, is_template)
SELECT t.id, 'Consejo de Belleza', 'Consejo del día: Mantén tus uñas siempre hidratadas para una apariencia saludable. 💅 #Consejo #Belleza #Cuidado', 'consejo', ARRAY['consejo', 'belleza', 'cuidado'], true
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM social_content_library scl 
    WHERE scl.tenant_id = t.id AND scl.title = 'Consejo de Belleza'
);

-- ========================================================================
-- 4. VERIFICACIÓN
-- ========================================================================

-- Verificar que las tablas se crearon correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'social_%'
ORDER BY table_name;

-- Fin de la migración simplificada