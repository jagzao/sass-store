-- MIGRACIÓN MÍNIMA: Solo crear tablas básicas
-- Ejecutar esto primero para crear la estructura básica

-- Establecer schema public
SET search_path TO public;

-- Crear tabla social_posts (básica)
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title_internal VARCHAR(255) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'draft',
    campaign_id UUID,
    format VARCHAR(20) DEFAULT 'post',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla social_post_variants (básica)
CREATE TABLE IF NOT EXISTS social_post_variants (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL,
    platform VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla tenant_social_platforms (básica)
CREATE TABLE IF NOT EXISTS tenant_social_platforms (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    platform VARCHAR(10) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    connected BOOLEAN DEFAULT false,
    daily_limit INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla social_content_library (básica)
CREATE TABLE IF NOT EXISTS social_content_library (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    category VARCHAR(50) DEFAULT 'general',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla social_post_analytics (básica)
CREATE TABLE IF NOT EXISTS social_post_analytics (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL,
    platform VARCHAR(10) NOT NULL,
    metric_date DATE NOT NULL,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar que las tablas se crearon
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'social_%'
ORDER BY table_name;