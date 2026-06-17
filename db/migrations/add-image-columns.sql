-- Add image_url columns to products and services tables

-- Add image_url to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url to services table (in addition to before/after images)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update with placeholder images for wondernails services
UPDATE services
SET image_url = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80'
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'wondernails')
AND image_url IS NULL;

-- Update with placeholder images for wondernails products
UPDATE products
SET image_url = 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=800&q=80'
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'wondernails')
AND image_url IS NULL;

-- Update with placeholder images for vigistudio services
UPDATE services
SET image_url = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80'
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'vigistudio')
AND image_url IS NULL;

-- Update with placeholder images for other tenants
UPDATE services
SET image_url = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80'
WHERE image_url IS NULL;

UPDATE products
SET image_url = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
WHERE image_url IS NULL;

SELECT 'Image columns added and populated with placeholders' as message;
