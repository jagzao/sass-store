-- Verificar que los datos estén correctamente insertados

-- 1. Verificar tenants
SELECT 'Tenants:' as check_type, COUNT(*) as count FROM tenants;
SELECT slug, name FROM tenants ORDER BY slug;

-- 2. Verificar services
SELECT 'Services:' as check_type, COUNT(*) as count FROM services;
SELECT s.name, s.price, t.slug as tenant_slug
FROM services s
JOIN tenants t ON s.tenant_id = t.id
ORDER BY t.slug, s.name
LIMIT 10;

-- 3. Verificar products
SELECT 'Products:' as check_type, COUNT(*) as count FROM products;
SELECT p.name, p.price, t.slug as tenant_slug
FROM products p
JOIN tenants t ON p.tenant_id = t.id
ORDER BY t.slug, p.name
LIMIT 10;

-- 4. Verificar staff
SELECT 'Staff:' as check_type, COUNT(*) as count FROM staff;
SELECT s.name, s.email, t.slug as tenant_slug
FROM staff s
JOIN tenants t ON s.tenant_id = t.id
ORDER BY t.slug, s.name
LIMIT 10;

-- 5. Verificar audit_logs schema
SELECT 'Audit Logs Schema:' as check_type;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;
