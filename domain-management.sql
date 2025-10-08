-- Domain Management Schema Extension
-- Add custom domain support to tenants table

-- Add custom domain fields to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS domain_verification_token VARCHAR(64),
ADD COLUMN IF NOT EXISTS ssl_status VARCHAR(20) DEFAULT 'pending';

-- Create domain_settings table for advanced domain configuration
CREATE TABLE IF NOT EXISTS domain_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    domain_type VARCHAR(20) NOT NULL CHECK (domain_type IN ('subdomain', 'custom')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'disabled')),
    ssl_certificate_status VARCHAR(20) DEFAULT 'pending' CHECK (ssl_certificate_status IN ('pending', 'active', 'failed', 'expired')),
    verification_token VARCHAR(64),
    verification_method VARCHAR(20) DEFAULT 'dns' CHECK (verification_method IN ('dns', 'file', 'email')),
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(tenant_id, domain),
    UNIQUE(domain)
);

-- Create index for fast domain lookup
CREATE INDEX IF NOT EXISTS idx_domain_settings_domain ON domain_settings(domain);
CREATE INDEX IF NOT EXISTS idx_domain_settings_tenant_id ON domain_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domain_settings_status ON domain_settings(status);

-- Create domain_redirects table for domain redirect rules
CREATE TABLE IF NOT EXISTS domain_redirects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_domain VARCHAR(255) NOT NULL,
    target_domain VARCHAR(255) NOT NULL,
    redirect_type INTEGER DEFAULT 301 CHECK (redirect_type IN (301, 302)),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default domain settings for existing tenants
INSERT INTO domain_settings (tenant_id, domain, domain_type, status, ssl_certificate_status)
SELECT
    id,
    slug || '.sassstore.com',
    'subdomain',
    'active',
    'active'
FROM tenants
WHERE slug != 'zo-system'
ON CONFLICT (domain) DO NOTHING;

-- Insert zo-system main domain
INSERT INTO domain_settings (tenant_id, domain, domain_type, status, ssl_certificate_status)
SELECT
    id,
    'sassstore.com',
    'custom',
    'active',
    'active'
FROM tenants
WHERE slug = 'zo-system'
ON CONFLICT (domain) DO NOTHING;

-- Create function to validate domain format
CREATE OR REPLACE FUNCTION validate_domain_format(domain_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic domain validation regex
    RETURN domain_name ~ '^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$';
END;
$$ LANGUAGE plpgsql;

-- Create function to generate verification token
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate verification tokens
CREATE OR REPLACE FUNCTION auto_generate_verification_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_token IS NULL THEN
        NEW.verification_token = generate_verification_token();
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_verification_token
    BEFORE INSERT OR UPDATE ON domain_settings
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_verification_token();

-- Create RLS policies for domain settings
ALTER TABLE domain_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_redirects ENABLE ROW LEVEL SECURITY;

-- Policy for tenants to access their own domain settings
CREATE POLICY tenant_domain_settings_policy ON domain_settings
    FOR ALL
    TO authenticated
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid)
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- Policy for tenants to access their own domain redirects
CREATE POLICY tenant_domain_redirects_policy ON domain_redirects
    FOR ALL
    TO authenticated
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid)
    WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- Create view for easy domain lookup
CREATE OR REPLACE VIEW domain_lookup AS
SELECT
    ds.domain,
    t.slug as tenant_slug,
    t.id as tenant_id,
    t.name as tenant_name,
    ds.domain_type,
    ds.status,
    ds.ssl_certificate_status,
    ds.verified_at,
    t.settings as tenant_settings
FROM domain_settings ds
JOIN tenants t ON ds.tenant_id = t.id
WHERE ds.status = 'active';

-- Grant permissions
GRANT SELECT ON domain_lookup TO authenticated;
GRANT ALL ON domain_settings TO authenticated;
GRANT ALL ON domain_redirects TO authenticated;

-- Create function for domain resolution (used by middleware)
CREATE OR REPLACE FUNCTION resolve_tenant_by_domain(domain_name TEXT)
RETURNS TABLE (
    tenant_id UUID,
    tenant_slug TEXT,
    tenant_name TEXT,
    domain_type TEXT,
    settings JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dl.tenant_id,
        dl.tenant_slug,
        dl.tenant_name,
        dl.domain_type,
        dl.tenant_settings
    FROM domain_lookup dl
    WHERE dl.domain = domain_name
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the resolution function
GRANT EXECUTE ON FUNCTION resolve_tenant_by_domain TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_tenant_by_domain TO anon;