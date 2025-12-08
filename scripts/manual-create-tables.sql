-- Create tenants table matching ORM schema
CREATE TABLE IF NOT EXISTS tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug varchar(50) UNIQUE NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    mode varchar(20) DEFAULT 'catalog' NOT NULL,
    status varchar(20) DEFAULT 'active' NOT NULL,
    timezone varchar(50) DEFAULT 'America/Mexico_City' NOT NULL,
    branding jsonb DEFAULT '{}'::jsonb NOT NULL,
    contact jsonb DEFAULT '{}'::jsonb NOT NULL,
    location jsonb DEFAULT '{}'::jsonb NOT NULL,
    quotas jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Create services table matching ORM schema
CREATE TABLE IF NOT EXISTS services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    name varchar(200) NOT NULL,
    description text,
    price numeric(10, 2) NOT NULL,
    duration integer NOT NULL,
    before_image text,
    after_image text,
    featured boolean DEFAULT false,
    active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Insert Wondernails Tenant
INSERT INTO tenants (id, name, slug, status, mode, timezone, branding, contact, location, quotas) VALUES 
('00000000-0000-0000-0000-000000000001', 'Wonder Nails', 'wondernails', 'active', 'catalog', 'America/Mexico_City', '{}', '{}', '{}', '{}')
ON CONFLICT (slug) DO NOTHING;
