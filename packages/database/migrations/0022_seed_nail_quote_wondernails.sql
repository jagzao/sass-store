-- STRY-032: Seed nail quote catalog and flag wondernails as nail_salon

INSERT INTO tenant_configs (tenant_id, category, key, value)
SELECT id, 'business', 'type', '["salud y belleza", "nail_salon"]'::jsonb
FROM tenants
WHERE slug = 'wondernails'
ON CONFLICT (tenant_id, category, key) DO UPDATE
SET value = EXCLUDED.value;

WITH wondernails_tenant AS (
  SELECT id FROM tenants WHERE slug = 'wondernails'
)
INSERT INTO nail_quote_options (tenant_id, category, key, label, base_price, base_duration_minutes, "order")
SELECT t.id, v.category, v.key, v.label, v.base_price, v.base_duration_minutes, v."order"
FROM wondernails_tenant t
CROSS JOIN (VALUES
  ('material', 'rubber', 'Rubber', 52000, 90, 1),
  ('material', 'tech_gel', 'Tech Gel', 56000, 105, 2),
  ('material', 'acrilico', 'Acrilico', 52000, 90, 3),
  ('material', 'press_on', 'Press On', 45000, 60, 4),
  ('length', 'xs', 'XS', 0, 0, 1),
  ('length', 's', 'S', 0, 0, 2),
  ('length', 'm', 'M', 0, 15, 3),
  ('length', 'l', 'L', 0, 30, 4),
  ('length', 'xl', 'XL', 0, 45, 5),
  ('shape', 'almendra', 'Almendra', 0, 0, 1),
  ('shape', 'cuadrada', 'Cuadrada', 0, 0, 2),
  ('shape', 'coffin', 'Coffin', 0, 0, 3),
  ('shape', 'stiletto', 'Stiletto', 0, 0, 4),
  ('addon', 'glitter', 'Glitter', 3000, 15, 1),
  ('addon', 'cristales', 'Cristales', 5000, 30, 2),
  ('addon', 'french', 'French', 5000, 15, 3),
  ('addon', '3d_art', '3D Art', 8000, 45, 4),
  ('addon', 'retro', 'Retro', 4000, 20, 5),
  ('addon', 'reparacion', 'Reparacion', 6000, 30, 6),
  ('addon', 'inspiracion', 'Inspiracion', 2000, 15, 7)
) AS v(category, key, label, base_price, base_duration_minutes, "order")
ON CONFLICT (tenant_id, category, key) DO UPDATE
SET
  label = EXCLUDED.label,
  base_price = EXCLUDED.base_price,
  base_duration_minutes = EXCLUDED.base_duration_minutes,
  "order" = EXCLUDED."order",
  is_active = true;
