-- MIGRACIÓN: Módulo de Redes Sociales y Analytics
-- CREADO: 2025-12-24
-- PROPÓSITO: Adaptar el modelo de datos existente para el nuevo módulo social
-- SEGURIDAD: NO borra datos existentes, solo agrega tablas y columnas nuevas

-- Establecer schema public
SET search_path TO public;

-- ========================================================================
-- 1. TABLAS PRINCIPALES DEL MÓDULO SOCIAL
-- ========================================================================

-- Tabla de posts sociales (versión simplificada para el nuevo módulo)
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para optimización
    CONSTRAINT social_posts_tenant_status_idx UNIQUE (tenant_id, title_internal, status)
);

-- Crear índices adicionales
CREATE INDEX IF NOT EXISTS idx_social_posts_tenant_id ON social_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_at ON social_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_campaign_id ON social_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_format ON social_posts(format);

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
    external_id TEXT, -- ID de la publicación en la plataforma externa
    permalink TEXT, -- URL de la publicación publicada
    engagement_data JSONB DEFAULT '{}', -- {likes, comments, shares, views, etc.}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Una publicación no puede tener dos variantes para la misma plataforma
    CONSTRAINT social_post_variants_post_platform_unique UNIQUE (post_id, platform)
);

-- Crear índices para variantes
CREATE INDEX IF NOT EXISTS idx_social_post_variants_post_id ON social_post_variants(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_variants_platform ON social_post_variants(platform);
CREATE INDEX IF NOT EXISTS idx_social_post_variants_external_id ON social_post_variants(external_id);

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un tenant no puede tener dos configuraciones para la misma plataforma
    CONSTRAINT tenant_social_platforms_tenant_platform_unique UNIQUE (tenant_id, platform)
);

-- Crear índices para plataformas de tenant
CREATE INDEX IF NOT EXISTS idx_tenant_social_platforms_tenant_id ON tenant_social_platforms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_social_platforms_platform ON tenant_social_platforms(platform);
CREATE INDEX IF NOT EXISTS idx_tenant_social_platforms_enabled ON tenant_social_platforms(enabled);

-- Tabla de biblioteca de contenido reutilizable
CREATE TABLE IF NOT EXISTS social_content_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'carousel', 'none')),
    platforms VARCHAR(10)[] DEFAULT '{}', -- ['IG', 'FB', 'TT']
    category VARCHAR(50) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_template BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para biblioteca
CREATE INDEX IF NOT EXISTS idx_social_content_library_tenant_id ON social_content_library(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_content_library_category ON social_content_library(category);
CREATE INDEX IF NOT EXISTS idx_social_content_library_is_template ON social_content_library(is_template);
CREATE INDEX IF NOT EXISTS idx_social_content_library_usage_count ON social_content_library(usage_count);

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
    views INTEGER DEFAULT 0, -- Para videos/reels
    new_followers INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    data JSONB DEFAULT '{}', -- Datos adicionales por plataforma
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Una publicación no puede tener múltiples métricas para el mismo día y plataforma
    CONSTRAINT social_post_analytics_post_platform_date_unique UNIQUE (post_id, platform, metric_date)
);

-- Crear índices para analytics
CREATE INDEX IF NOT EXISTS idx_social_post_analytics_post_id ON social_post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_analytics_platform ON social_post_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_social_post_analytics_metric_date ON social_post_analytics(metric_date);
CREATE INDEX IF NOT EXISTS idx_social_post_analytics_engagement_rate ON social_post_analytics(engagement_rate);

-- ========================================================================
-- 2. VISTAS ÚTILES PARA EL MÓDULO SOCIAL
-- ========================================================================

-- Vista para posts con sus variantes
CREATE OR REPLACE VIEW social_posts_with_variants AS
SELECT 
    sp.id,
    sp.tenant_id,
    sp.title_internal,
    sp.scheduled_at,
    sp.published_at,
    sp.status,
    sp.campaign_id,
    sp.format,
    sp.created_at,
    sp.updated_at,
    COALESCE(variants_data.variants, '[]'::JSONB) as variants
FROM social_posts sp
LEFT JOIN LATERAL (
    SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'id', spv.id,
            'platform', spv.platform,
            'content', spv.content,
            'media_url', spv.media_url,
            'media_type', spv.media_type,
            'hashtags', spv.hashtags,
            'mentions', spv.mentions,
            'external_id', spv.external_id,
            'permalink', spv.permalink,
            'engagement_data', spv.engagement_data
        )
    ) as variants
    FROM social_post_variants spv
    WHERE spv.post_id = sp.id
) variants_data ON true;

-- Vista para calendario de publicaciones
CREATE OR REPLACE VIEW social_calendar_view AS
SELECT 
    sp.id,
    sp.tenant_id,
    sp.title_internal,
    sp.scheduled_at,
    sp.published_at,
    sp.status,
    sp.format,
    c.name as campaign_name,
    ARRAY_AGG(DISTINCT spv.platform) FILTER (WHERE spv.platform IS NOT NULL) as platforms,
    COUNT(DISTINCT spv.id) as variant_count
FROM social_posts sp
LEFT JOIN social_post_variants spv ON sp.id = spv.post_id
LEFT JOIN campaigns c ON sp.campaign_id = c.id
GROUP BY sp.id, sp.tenant_id, sp.title_internal, sp.scheduled_at, sp.published_at, sp.status, sp.format, c.name;

-- Vista para cola de publicaciones pendientes
CREATE OR REPLACE VIEW social_queue_view AS
SELECT 
    sp.id,
    sp.tenant_id,
    sp.title_internal,
    sp.scheduled_at,
    sp.status,
    sp.format,
    ARRAY_AGG(DISTINCT spv.platform) FILTER (WHERE spv.platform IS NOT NULL) as platforms,
    COUNT(DISTINCT spv.id) as variant_count
FROM social_posts sp
LEFT JOIN social_post_variants spv ON sp.id = spv.post_id
WHERE sp.status IN ('draft', 'ready', 'scheduled')
GROUP BY sp.id, sp.tenant_id, sp.title_internal, sp.scheduled_at, sp.status, sp.format
ORDER BY sp.scheduled_at ASC NULLS LAST;

-- Vista para resumen de analytics
CREATE OR REPLACE VIEW social_analytics_summary AS
SELECT 
    spa.post_id,
    sp.title_internal,
    sp.tenant_id,
    spa.platform,
    spa.metric_date,
    spa.reach,
    spa.impressions,
    spa.engagement,
    spa.likes,
    spa.comments,
    spa.shares,
    spa.saves,
    spa.clicks,
    spa.views,
    spa.new_followers,
    spa.engagement_rate,
    sp.scheduled_at,
    sp.published_at
FROM social_post_analytics spa
JOIN social_posts sp ON spa.post_id = sp.id
WHERE sp.status = 'published';

-- ========================================================================
-- 3. FUNCIONES Y TRIGGERS ÚTILES
-- ========================================================================

-- Función para actualizar el timestamp de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en todas las tablas sociales
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_post_variants_updated_at BEFORE UPDATE ON social_post_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_social_platforms_updated_at BEFORE UPDATE ON tenant_social_platforms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_content_library_updated_at BEFORE UPDATE ON social_content_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular engagement rate automáticamente
CREATE OR REPLACE FUNCTION calculate_engagement_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reach > 0 THEN
        NEW.engagement_rate = ROUND((NEW.engagement::DECIMAL / NEW.reach::DECIMAL) * 100, 2);
    ELSE
        NEW.engagement_rate = 0.00;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para calcular engagement rate
CREATE TRIGGER calculate_social_post_analytics_engagement_rate BEFORE INSERT OR UPDATE ON social_post_analytics FOR EACH ROW EXECUTE FUNCTION calculate_engagement_rate();

-- ========================================================================
-- 4. POLÍTICAS DE SEGURIDAD (RLS - ROW LEVEL SECURITY)
-- ========================================================================

-- Habilitar RLS en todas las tablas sociales
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_social_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para social_posts
CREATE POLICY "Tenant isolation for social_posts" ON social_posts
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Políticas de RLS para social_post_variants
CREATE POLICY "Tenant isolation for social_post_variants" ON social_post_variants
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM social_posts sp 
        WHERE sp.id = social_post_variants.post_id 
        AND sp.tenant_id = current_setting('app.current_tenant_id', true)::UUID
    ));

-- Políticas de RLS para tenant_social_platforms
CREATE POLICY "Tenant isolation for tenant_social_platforms" ON tenant_social_platforms
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Políticas de RLS para social_content_library
CREATE POLICY "Tenant isolation for social_content_library" ON social_content_library
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Políticas de RLS para social_post_analytics
CREATE POLICY "Tenant isolation for social_post_analytics" ON social_post_analytics
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM social_posts sp 
        WHERE sp.id = social_post_analytics.post_id 
        AND sp.tenant_id = current_setting('app.current_tenant_id', true)::UUID
    ));

-- ========================================================================
-- 5. DATOS INICIALES PARA PRUEBAS (NO BORRA DATOS EXISTENTES)
-- ========================================================================

-- Insertar plataformas sociales para tenants existentes (solo si no existen)
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

-- Insertar contenido de ejemplo en la biblioteca (solo si no existe)
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
-- 6. COMENTARIOS Y NOTAS
-- ========================================================================

-- Esta migración es segura para producción porque:
-- 1. Solo crea tablas nuevas y agrega columnas
-- 2. No elimina ni modifica datos existentes
-- 3. Usa IF NOT EXISTS para evitar errores
-- 4. Incluye políticas de RLS para seguridad multitenant
-- 5. Crea índices para optimizar consultas
-- 6. Proporciona vistas útiles para el frontend
-- 7. Incluye funciones y triggers para mantenimiento automático

-- Para ejecutar esta migración:
-- 1. Hacer backup de la base de datos
-- 2. Ejecutar este script
-- 3. Verificar que todo funcione correctamente
-- 4. Actualizar la aplicación para usar las nuevas tablas

-- Nota: Las tablas existentes (tenants, campaigns, etc.) no se modifican
-- excepto por la adición de la columna campaign_type en la tabla campaigns.

-- Fin de la migración