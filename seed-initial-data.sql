-- ========================================
-- SEED INITIAL DATA
-- Creates a test tenant: wondernails
-- ========================================

-- Insert a test tenant
INSERT INTO tenants (
  id,
  slug,
  name,
  description,
  mode,
  status,
  branding,
  contact,
  location,
  quotas
) VALUES (
  gen_random_uuid(),
  'wondernails',
  'Wonder Nails',
  'Salón de belleza especializado en manicure y pedicure',
  'catalog',
  'active',
  '{"logo": "", "colors": {"primary": "#E91E63", "secondary": "#9C27B0"}}'::jsonb,
  '{"email": "info@wondernails.com", "phone": "+52 55 1234 5678"}'::jsonb,
  '{"address": "Av. Principal 123, CDMX", "city": "Ciudad de México", "country": "México"}'::jsonb,
  '{"maxProducts": 100, "maxServices": 50, "maxStaff": 10}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Insert some sample services
INSERT INTO services (tenant_id, name, description, price, duration, featured, active)
SELECT
  t.id,
  'Manicure Clásico',
  'Manicure básico con esmaltado tradicional',
  250.00,
  60,
  true,
  true
FROM tenants t WHERE t.slug = 'wondernails'
ON CONFLICT DO NOTHING;

INSERT INTO services (tenant_id, name, description, price, duration, featured, active)
SELECT
  t.id,
  'Pedicure Spa',
  'Pedicure completo con exfoliación y masaje',
  350.00,
  90,
  true,
  true
FROM tenants t WHERE t.slug = 'wondernails'
ON CONFLICT DO NOTHING;

INSERT INTO services (tenant_id, name, description, price, duration, featured, active)
SELECT
  t.id,
  'Uñas Gel',
  'Aplicación de uñas de gel con diseño personalizado',
  450.00,
  120,
  true,
  true
FROM tenants t WHERE t.slug = 'wondernails'
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Initial data seeded successfully!' as message;
