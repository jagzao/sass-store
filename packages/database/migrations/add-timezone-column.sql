-- Add timezone column to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS timezone varchar(50) NOT NULL DEFAULT 'America/Mexico_City';

-- Add index for timezone if needed for queries
CREATE INDEX IF NOT EXISTS tenant_timezone_idx ON tenants (timezone);
