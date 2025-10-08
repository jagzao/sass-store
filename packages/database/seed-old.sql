-- Seed data for production database
-- All tenants with complete information

-- Insert all tenants
INSERT INTO tenants (slug, name, description, mode, status, branding, contact, location, quotas) VALUES
('zo-system', 'Zo System', 'Desarrollo de software premium y consultoría tecnológica', 'catalog', 'active',
  '{"primaryColor": "#DC2626", "secondaryColor": "#991B1B", "logo": "/logos/zo-system.png"}',
  '{"email": "info@zo-system.com", "phone": "+52 55 1234 5678", "website": "https://zo-system.com"}',
  '{"address": "Ciudad de México, México", "coordinates": {"lat": 19.4326, "lng": -99.1332}}',
  '{"maxProducts": 1000, "maxServices": 100, "maxMedia": 5000, "maxBookings": 10000}'
),
('wondernails', 'Wonder Nails', 'Estudio de manicure y pedicure premium', 'booking', 'active',
  '{"primaryColor": "#EC4899", "secondaryColor": "#BE185D", "logo": "/logos/wondernails.png"}',
  '{"email": "info@wondernails.com", "phone": "+52 55 2345 6789", "website": "https://wondernails.com"}',
  '{"address": "Polanco, Ciudad de México", "coordinates": {"lat": 19.4326, "lng": -99.1332}}',
  '{"maxProducts": 50, "maxServices": 20, "maxMedia": 500, "maxBookings": 1000}'
),
('vigistudio', 'Vigi Studio', 'Salón de belleza y peluquería profesional', 'booking', 'active',
  '{"primaryColor": "#8B5CF6", "secondaryColor": "#7C3AED", "logo": "/logos/vigistudio.png"}',
  '{"email": "info@vigistudio.com", "phone": "+52 55 3456 7890", "website": "https://vigistudio.com"}',
  '{"address": "Roma Norte, Ciudad de México", "coordinates": {"lat": 19.4147, "lng": -99.1655}}',
  '{"maxProducts": 100, "maxServices": 30, "maxMedia": 800, "maxBookings": 2000}'
),
('centro-tenistico', 'Centro Tenístico Villafuerte', 'Clases de tenis y entrenamiento deportivo', 'booking', 'active',
  '{"primaryColor": "#10B981", "secondaryColor": "#059669", "logo": "/logos/centro-tenistico.png"}',
  '{"email": "info@centro-tenistico.com", "phone": "+52 55 4567 8901", "website": "https://centro-tenistico.com"}',
  '{"address": "Coyoacán, Ciudad de México", "coordinates": {"lat": 19.3467, "lng": -99.1618}}',
  '{"maxProducts": 30, "maxServices": 15, "maxMedia": 300, "maxBookings": 500}'
),
('vainilla-vargas', 'Vainilla Vargas', 'Vainilla premium mexicana de exportación', 'catalog', 'active',
  '{"primaryColor": "#F59E0B", "secondaryColor": "#D97706", "logo": "/logos/vainilla-vargas.png"}',
  '{"email": "info@vainilla-vargas.com", "phone": "+52 55 5678 9012", "website": "https://vainilla-vargas.com"}',
  '{"address": "Papantla, Veracruz", "coordinates": {"lat": 20.4580, "lng": -97.3158}}',
  '{"maxProducts": 200, "maxServices": 5, "maxMedia": 400, "maxBookings": 100}'
),
('delirios', 'Delirios', 'Comida saludable y deliciosa con delivery', 'catalog', 'active',
  '{"primaryColor": "#65A30D", "secondaryColor": "#4D7C0F", "logo": "/logos/delirios.png"}',
  '{"email": "info@delirios.com", "phone": "+52 55 6789 0123", "website": "https://delirios.com"}',
  '{"address": "Condesa, Ciudad de México", "coordinates": {"lat": 19.4069, "lng": -99.1703}}',
  '{"maxProducts": 150, "maxServices": 10, "maxMedia": 600, "maxBookings": 800}'
),
('nom-nom', 'nom-nom Tacos', 'Tacos de guisado auténticos mexicanos', 'catalog', 'active',
  '{"primaryColor": "#EA580C", "secondaryColor": "#C2410C", "logo": "/logos/nom-nom.png"}',
  '{"email": "info@nom-nom.com", "phone": "+52 55 7890 1234", "website": "https://nom-nom.com"}',
  '{"address": "Doctores, Ciudad de México", "coordinates": {"lat": 19.4284, "lng": -99.1437}}',
  '{"maxProducts": 80, "maxServices": 5, "maxMedia": 200, "maxBookings": 300}'
);

-- Sample products for zo-system
INSERT INTO products (tenant_id, sku, name, description, price, category, featured, metadata)
SELECT t.id, 'ZS-SAAS-001', 'SaaS Starter Kit', 'Kit completo para desarrollo SaaS con autenticación, payments y multi-tenancy', 299.00, 'software', true,
  '{"features": ["Multi-tenant", "Authentication", "Payments", "Dashboard"], "tech": ["Next.js", "PostgreSQL", "Stripe"]}'::jsonb
FROM tenants t WHERE t.slug = 'zo-system'
UNION ALL
SELECT t.id, 'ZS-CONS-001', 'Tech Consultation', 'Consultoría tecnológica personalizada', 150.00, 'software', true,
  '{"duration": "1 hour", "delivery": "video call", "includes": ["Technical review", "Recommendations", "Follow-up"]}'::jsonb
FROM tenants t WHERE t.slug = 'zo-system';

-- Sample services for beauty tenants
INSERT INTO services (tenant_id, name, description, price, duration, featured, metadata)
SELECT t.id, 'Gel Manicure', 'Manicure con gel de larga duración', 45.00, 60, true,
  '{"includes": ["Nail shaping", "Cuticle care", "Gel polish", "Hand massage"]}'::jsonb
FROM tenants t WHERE t.slug = 'wondernails'
UNION ALL
SELECT t.id, 'Signature Blowout', 'Peinado profesional con productos premium', 55.00, 45, true,
  '{"includes": ["Hair wash", "Styling", "Blow dry", "Finishing products"]}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio'
UNION ALL
SELECT t.id, 'Tennis Class', 'Clase individual de tenis profesional', 80.00, 60, true,
  '{"includes": ["Equipment", "Professional coaching", "Court rental", "Progress tracking"]}'::jsonb
FROM tenants t WHERE t.slug = 'centro-tenistico';

-- Sample products for food tenants
INSERT INTO products (tenant_id, sku, name, description, price, category, featured, metadata)
SELECT t.id, 'VV-VANILLA-25G', 'Vainilla Gourmet 25g', 'Vainilla premium de Papantla, calidad exportación', 15.00, 'spices', true,
  '{"origin": "Papantla, Veracruz", "organic": true, "weight": "25g", "export_quality": true}'::jsonb
FROM tenants t WHERE t.slug = 'vainilla-vargas'
UNION ALL
SELECT t.id, 'DEL-BOWL-001', 'Buddha Bowl', 'Bowl saludable con quinoa, vegetales y proteína', 12.50, 'healthy', true,
  '{"calories": 420, "protein": "15g", "carbs": "45g", "fat": "18g", "vegan": true}'::jsonb
FROM tenants t WHERE t.slug = 'delirios'
UNION ALL
SELECT t.id, 'NN-TACOS-PASTOR', 'Tacos de Pastor (3 pzs)', 'Tacos auténticos con pastor artesanal', 8.50, 'tacos', true,
  '{"pieces": 3, "meat": "pastor", "includes": ["Pineapple", "Onion", "Cilantro"], "spicy": "medium"}'::jsonb
FROM tenants t WHERE t.slug = 'nom-nom';