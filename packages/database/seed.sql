-- =====================================================
-- SEED DATA - REALISTIC BUSINESS DATA
-- Last Updated: 2025-10-08
-- All tenants with complete, realistic information
-- =====================================================

-- cd apps/api
-- npx dotenv-cli -e ../../.env.local -- npx tsx scripts/seed.ts

-- Clean existing data
TRUNCATE TABLE bookings, order_items, orders, products, services, staff, tenants CASCADE;

-- =====================================================
-- TENANTS
-- =====================================================

INSERT INTO tenants (slug, name, description, mode, status, branding, contact, location, quotas) VALUES

-- 1. ZO SYSTEM - Software Development & Consulting
('zo-system', 'Zo System', 'Desarrollo de software premium y consultoría tecnológica especializada en soluciones SaaS', 'catalog', 'active',
  '{"primaryColor": "#DC2626", "secondaryColor": "#991B1B", "accentColor": "#FCA5A5", "logo": "/logos/zo-system.png"}',
  '{"email": "jagzao@gmail.com", "phone": "+52 55 4926 4189", "website": "https://zo-system.com", "address": "Av. Insurgentes Sur 1602, Crédito Constructor, Benito Juárez, 03940 Ciudad de México, CDMX", "hours": {"monday": "9:00-18:00", "tuesday": "9:00-18:00", "wednesday": "9:00-18:00", "thursday": "9:00-18:00", "friday": "9:00-17:00", "saturday": "Cerrado", "sunday": "Cerrado"}}',
  '{"address": "Insurgentes Sur 1602, CDMX", "city": "Ciudad de México", "state": "CDMX", "country": "México", "zipCode": "03940", "coordinates": {"lat": 19.3700, "lng": -99.1700}}',
  '{"maxProducts": 1000, "maxServices": 100, "maxMedia": 5000, "maxBookings": 10000}'
),

-- 2. WONDER NAILS - Premium Nail Salon
('wondernails', 'Wonder Nails Studio', 'Salón de uñas premium especializado en manicure, pedicure y nail art de alta calidad', 'booking', 'active',
  '{"primaryColor": "#C026D3", "secondaryColor": "#7C3AED", "accentColor": "#F3E8FF", "logo": "/logos/wondernails.png"}',
  '{"email": "marialiciavh1984@gmail.mx", "phone": "+52 1 55 6406 8409", "website": "https://wondernails.mx", "address": "Manzana 012, San Lorenzo, 56140 Texcoco, State of Mexico, Mexico", "hours": {"monday": "10:00-20:00", "tuesday": "10:00-20:00", "wednesday": "10:00-20:00", "thursday": "10:00-20:00", "friday": "10:00-21:00", "saturday": "9:00-21:00", "sunday": "10:00-18:00"}}',
  '{"address": "Manzana 012, San Lorenzo", "city": "Texcoco", "state": "State of Mexico", "country": "México", "zipCode": "56140", "coordinates": {"lat": 19.5028458, "lng": -98.8833265}}',
  '{"maxProducts": 100, "maxServices": 50, "maxMedia": 1000, "maxBookings": 5000}'
),

-- 3. VIGI STUDIO - Beauty Salon & Hair Styling
('vigistudio', 'Vigi Studio', 'Salón de belleza integral: cortes, color, peinados, maquillaje y tratamientos capilares', 'booking', 'active',
  '{"primaryColor": "#8B5CF6", "secondaryColor": "#7C3AED", "accentColor": "#DDD6FE", "logo": "/logos/vigistudio.png"}',
  '{"email": "hola@vigistudio.mx", "phone": "+525621990000", "website": "https://vigistudio.mx", "address": "Cda. 1-a Rtno. 21-3, San Lorenzo, 56140 Texcoco de Mora, 56140 México, Méx.", "hours": {"monday": "12:00-20:00", "tuesday": "12:00-20:00", "wednesday": "12:00-20:00", "thursday": "12:00-20:00", "friday": "12:00-20:00", "saturday": "10:00-18:00", "sunday": "Cerrado"}}',
  '{"address": "Cda. 1-a Rtno. 21-3, San Lorenzo", "city": "Texcoco de Mora", "state": "México", "country": "México", "zipCode": "56140", "coordinates": {"lat": 19.5109989, "lng": -98.8689658}}',
  '{"maxProducts": 150, "maxServices": 40, "maxMedia": 800, "maxBookings": 3000}'
),

-- 4. CENTRO TENÍSTICO - Tennis Club & Training
('centro-tenistico', 'Centro Tenístico Elite', 'Club de tenis profesional con canchas premium, clases personalizadas y torneos', 'booking', 'active',
  '{"primaryColor": "#10B981", "secondaryColor": "#059669", "accentColor": "#A7F3D0", "logo": "/logos/centro-tenistico.png"}',
  '{"email": "info@tenisticoelite.mx", "phone": "+52 55 3690 1478", "website": "https://tenisticoelite.mx", "address": "Av. Universidad 3000, Copilco Universidad, Coyoacán, 04360 Ciudad de México, CDMX", "hours": {"monday": "6:00-22:00", "tuesday": "6:00-22:00", "wednesday": "6:00-22:00", "thursday": "6:00-22:00", "friday": "6:00-22:00", "saturday": "7:00-21:00", "sunday": "7:00-20:00"}}',
  '{"address": "Av. Universidad 3000, Coyoacán", "city": "Ciudad de México", "state": "CDMX", "country": "México", "zipCode": "04360", "coordinates": {"lat": 19.3467, "lng": -99.1618}}',
  '{"maxProducts": 80, "maxServices": 25, "maxMedia": 500, "maxBookings": 2000}'
),


-- 6. DELIRIOS - Healthy Food Delivery
('delirios', 'Delirios Healthy Kitchen', 'Comida saludable gourmet con ingredientes orgánicos - Delivery rápido en Distrito Federal', 'catalog', 'active',
  '{"primaryColor": "#65A30D", "secondaryColor": "#4D7C0F", "accentColor": "#D9F99D", "logo": "/logos/delirios.png"}',
  '{"email": "pedidos@delirios.mx", "phone": "+52 55 9012 3456", "website": "https://delirios.mx", "address": "Av. Nuevo León 107, Condesa, Cuauhtémoc, 06100 Ciudad de México, CDMX", "hours": {"monday": "8:00-22:00", "tuesday": "8:00-22:00", "wednesday": "8:00-22:00", "thursday": "8:00-22:00", "friday": "8:00-23:00", "saturday": "9:00-23:00", "sunday": "9:00-22:00"}}',
  '{"address": "Av. Nuevo León 107, Condesa", "city": "Ciudad de México", "state": "Distrito Federal", "country": "México", "zipCode": "06100", "coordinates": {"lat": 19.4069, "lng": -99.1703}}',
  '{"maxProducts": 250, "maxServices": 15, "maxMedia": 1000, "maxBookings": 4000}'
),

-- 6. NOM NOM TACOS - Authentic Mexican Street Tacos
('nom-nom', 'Nom Nom Tacos Auténticos', 'Tacos de guisado artesanales con recetas tradicionales mexicanas - Los mejores tacos de la CDMX', 'catalog', 'active',
  '{"primaryColor": "#EA580C", "secondaryColor": "#C2410C", "accentColor": "#FED7AA", "logo": "/logos/nom-nom.png"}',
  '{"email": "pedidos@nomnom.mx", "phone": "+525531001475", "website": "https://nomnom.mx", "facebook": "https://www.facebook.com/share/16sM5yxdVb/", "address": "C. Allende 742-744, San Sebastian, 56170 San Sebastián, Méx.", "hours": {"monday": "9:00-17:00", "tuesday": "9:00-17:00", "wednesday": "9:00-17:00", "thursday": "9:00-17:00", "friday": "9:00-17:00", "saturday": "9:00-17:00", "sunday": "Cerrado"}}',
  '{"address": "C. Allende 742-744, San Sebastian", "city": "San Sebastián", "state": "Méx.", "country": "México", "zipCode": "56170", "coordinates": {"lat": 19.5109939, "lng": -98.8663855}}',
  '{"maxProducts": 120, "maxServices": 5, "maxMedia": 400, "maxBookings": 1000}'
);

-- =====================================================
-- PRODUCTS
-- =====================================================

-- ZO SYSTEM Products
INSERT INTO products (tenant_id, sku, name, description, price, category,  featured, metadata)
SELECT t.id, 'ZS-SAAS-PRO', 'SaaS Pro Kit', 'Plantilla completa para aplicaciones SaaS multi-tenant con autenticación, pagos, dashboard admin y API GraphQL', 499.00, 'software', true,
  '{"image": "💼", "features": ["Multi-tenancy completo", "Auth con NextAuth", "Stripe Payments", "Dashboard Admin", "GraphQL API", "PostgreSQL + Drizzle"], "tech": ["Next.js 14", "TypeScript", "Tailwind CSS", "PostgreSQL"], "license": "comercial", "support": "6 meses"}'::jsonb
FROM tenants t WHERE t.slug = 'zo-system'
UNION ALL
SELECT t.id, 'ZS-ECOM-TEMP', 'E-Commerce Template', 'Plantilla de comercio electrónico con carrito, checkout, gestión de inventario y panel de administración', 349.00, 'software', true,
  '{"image": "🛒", "features": ["Carrito completo", "Checkout Stripe", "Gestión inventario", "Panel admin", "Reportes ventas"], "tech": ["Next.js", "React", "Tailwind"], "license": "comercial", "support": "3 meses"}'::jsonb
FROM tenants t WHERE t.slug = 'zo-system';

-- WONDER NAILS Products
INSERT INTO products (tenant_id, sku, name, description, price, category,  featured, metadata)
SELECT t.id, 'WN-POLISH-RUBY', 'Esmalte Gel Ruby Red', 'Esmalte en gel de larga duración color rojo rubí - Marca OPI Professional', 22.00, 'nail-products', true,
  '{"image": "💅", "brand": "OPI", "color": "Ruby Red", "duracion": "21 días", "volumen": "15ml", "formula": "Gel UV/LED"}'::jsonb
FROM tenants t WHERE t.slug = 'wondernails'
UNION ALL
SELECT t.id, 'WN-POLISH-PINK', 'Esmalte Gel Ballet Pink', 'Esmalte en gel rosa ballet - Acabado brillante profesional', 22.00, 'nail-products', true,
  '{"image": "🌸", "brand": "OPI", "color": "Ballet Pink", "duracion": "21 días", "volumen": "15ml"}'::jsonb
FROM tenants t WHERE t.slug = 'wondernails'
UNION ALL
SELECT t.id, 'WN-CUTICLE-OIL', 'Aceite de Cutícula Jojoba', 'Aceite nutritivo para cutículas con jojoba y vitamina E', 18.00, 'nail-care', false,
  '{"image": "✨", "brand": "CND", "ingredientes": ["Jojoba", "Vitamina E", "Aceite de almendras"], "volumen": "7.3ml"}'::jsonb
FROM tenants t WHERE t.slug = 'wondernails'
UNION ALL
SELECT t.id, 'WN-HAND-CREAM', 'Crema de Manos Premium', 'Crema hidratante de manos con manteca de karité', 25.00, 'hand-care', false,
  '{"image": "🧴", "brand": "OPI", "ingredientes": ["Manteca de karité", "Glicerina", "Vitamina A"], "volumen": "120ml"}'::jsonb
FROM tenants t WHERE t.slug = 'wondernails'
UNION ALL
SELECT t.id, 'WN-NAIL-FILE', 'Lima Profesional Cristal', 'Lima de uñas de cristal templado - Dura toda la vida', 15.00, 'tools', false,
  '{"image": "📏", "material": "Cristal templado", "grado": "180/240", "lavable": true, "garantia": "5 años"}'::jsonb
FROM tenants t WHERE t.slug = 'wondernails'
UNION ALL
SELECT t.id, 'WN-REMOVER', 'Removedor Gel Sin Acetona', 'Removedor de esmalte gel formulado sin acetona', 20.00, 'nail-care', false,
  '{"image": "🧪", "brand": "Gelish", "sin_acetona": true, "enriquecido": "Vitamina E", "volumen": "120ml"}'::jsonb
FROM tenants t WHERE t.slug = 'wondernails';

-- VIGI STUDIO Products
INSERT INTO products (tenant_id, sku, name, description, price, category,  featured, metadata)
SELECT t.id, 'VS-SHAMPOO-REPAIR', 'Shampoo Reparador Kerastase', 'Shampoo reparador para cabello dañado - Línea Resistance', 45.00, 'hair-care', true,
  '{"image": "🧴", "brand": "Kérastase", "linea": "Resistance", "tipo_cabello": "Dañado", "volumen": "250ml", "beneficios": ["Repara", "Fortalece", "Brillo"]}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio'
UNION ALL
SELECT t.id, 'VS-COND-HYDRA', 'Acondicionador Hidratante', 'Acondicionador hidratante intensivo para cabello seco', 42.00, 'hair-care', true,
  '{"image": "💧", "brand": "Kérastase", "linea": "Nutritive", "tipo_cabello": "Seco/Normal", "volumen": "200ml"}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio'
UNION ALL
SELECT t.id, 'VS-SERUM-SHINE', 'Serum Brillo Diamante', 'Serum para brillo intenso y anti-frizz', 55.00, 'styling', false,
  '{"image": "✨", "brand": "Moroccanoil", "uso": "Finishing", "ingredientes": ["Aceite de argán", "Vitamina E"], "volumen": "100ml"}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio'
UNION ALL
SELECT t.id, 'VS-SPRAY-HEAT', 'Protector Térmico Professional', 'Spray protector contra el calor hasta 230°C', 38.00, 'styling', false,
  '{"image": "🛡️", "brand": "GHD", "proteccion": "230°C", "beneficios": ["Anti-frizz", "Brillo", "Protección UV"], "volumen": "120ml"}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio';

-- CENTRO TENÍSTICO Products
INSERT INTO products (tenant_id, sku, name, description, price, category,  featured, metadata)
SELECT t.id, 'CT-RACKET-PRO', 'Raqueta Wilson Pro Staff', 'Raqueta de tenis profesional Wilson Pro Staff RF97 - Modelo Roger Federer', 450.00, 'equipment', true,
  '{"image": "🎾", "brand": "Wilson", "modelo": "Pro Staff RF97", "peso": "340g", "tamano_cabeza": "97 sq in", "nivel": "Avanzado/Profesional"}'::jsonb
FROM tenants t WHERE t.slug = 'centro-tenistico'
UNION ALL
SELECT t.id, 'CT-BALLS-PENN', 'Pelotas Penn Championship', 'Tubo de 3 pelotas Penn Championship - Aprobadas USTA', 12.00, 'balls', true,
  '{"image": "🟡", "brand": "Penn", "cantidad": 3, "tipo": "Extra Duty Felt", "aprobado": "USTA"}'::jsonb
FROM tenants t WHERE t.slug = 'centro-tenistico'
UNION ALL
SELECT t.id, 'CT-SHOES-NIKE', 'Tenis Nike Court Vapor', 'Zapatos de tenis Nike Court Air Zoom Vapor X', 180.00, 'footwear', false,
  '{"image": "👟", "brand": "Nike", "modelo": "Court Air Zoom Vapor X", "superficie": "Todas", "tecnologia": "Zoom Air"}'::jsonb
FROM tenants t WHERE t.slug = 'centro-tenistico'
UNION ALL
SELECT t.id, 'CT-BAG-WILSON', 'Bolsa Wilson Team', 'Bolsa para raquetas Wilson Team - Capacidad 6 raquetas', 85.00, 'accessories', false,
  '{"image": "🎒", "brand": "Wilson", "capacidad": "6 raquetas", "compartimentos": 3, "color": "Negro/Rojo"}'::jsonb
FROM tenants t WHERE t.slug = 'centro-tenistico';


-- DELIRIOS Products (Healthy Food)
INSERT INTO products (tenant_id, sku, name, description, price, category,  featured, metadata)
SELECT t.id, 'DEL-BUDDHA-BOWL', 'Buddha Bowl Proteico', 'Bowl saludable con quinoa, garbanzos rostizados, kale, aguacate, hummus y tahini', 145.00, 'bowls', true,
  '{"image": "🥗", "calorias": 520, "proteina": "22g", "carbohidratos": "58g", "grasas": "24g", "fibra": "15g", "vegan": true, "sin_gluten": true, "ingredientes": ["Quinoa", "Garbanzos", "Kale", "Aguacate", "Hummus", "Tahini", "Limón"]}'::jsonb
FROM tenants t WHERE t.slug = 'delirios'
UNION ALL
SELECT t.id, 'DEL-POKE-SALMON', 'Poke Bowl de Salmón', 'Arroz integral, salmón fresco, edamame, pepino, aguacate, alga nori y salsa ponzu', 185.00, 'bowls', true,
  '{"image": "🐟", "calorias": 580, "proteina": "35g", "carbohidratos": "52g", "grasas": "22g", "omega3": "Alto", "ingredientes": ["Arroz integral", "Salmón atlántico", "Edamame", "Aguacate", "Pepino", "Alga nori", "Ponzu"]}'::jsonb
FROM tenants t WHERE t.slug = 'delirios'
UNION ALL
SELECT t.id, 'DEL-SMOOTHIE-GREEN', 'Green Detox Smoothie', 'Smoothie detox con espinaca, piña, manzana verde, jengibre y spirulina', 95.00, 'beverages', true,
  '{"image": "🥤", "calorias": 180, "proteina": "4g", "carbohidratos": "42g", "vitaminas": ["C", "A", "K"], "vegano": true, "ingredientes": ["Espinaca", "Piña", "Manzana verde", "Jengibre", "Spirulina", "Agua de coco"], "volumen": "500ml"}'::jsonb
FROM tenants t WHERE t.slug = 'delirios'
UNION ALL
SELECT t.id, 'DEL-ENSALADA-GRIEGA', 'Ensalada Griega Premium', 'Lechuga romana, tomate cherry, pepino, queso feta, aceitunas kalamata, cebolla morada y vinagreta balsámica', 125.00, 'salads', true,
  '{"image": "🥙", "calorias": 320, "proteina": "12g", "carbohidratos": "18g", "grasas": "24g", "vegetariano": true, "ingredientes": ["Lechuga romana", "Tomate cherry", "Pepino", "Queso feta", "Aceitunas kalamata", "Cebolla morada", "Vinagreta balsámica"]}'::jsonb
FROM tenants t WHERE t.slug = 'delirios'
UNION ALL
SELECT t.id, 'DEL-WRAP-POLLO', 'Wrap de Pollo Teriyaki', 'Wrap integral con pollo teriyaki, vegetales salteados, arroz integral y salsa de soya baja en sodio', 135.00, 'wraps', false,
  '{"image": "🌯", "calorias": 480, "proteina": "32g", "carbohidratos": "54g", "grasas": "14g", "ingredientes": ["Tortilla integral", "Pechuga de pollo", "Arroz integral", "Pimientos", "Cebolla", "Zanahoria", "Salsa teriyaki"]}'::jsonb
FROM tenants t WHERE t.slug = 'delirios'
UNION ALL
SELECT t.id, 'DEL-JUICE-NARANJA', 'Jugo de Naranja Natural', 'Jugo de naranja 100% natural recién exprimido - Sin azúcar añadida', 65.00, 'beverages', false,
  '{"image": "🍊", "calorias": 120, "vitamina_c": "100% VD", "natural": true, "sin_azucar_anadida": true, "volumen": "500ml"}'::jsonb
FROM tenants t WHERE t.slug = 'delirios';

-- NOM NOM TACOS Products
INSERT INTO products (tenant_id, sku, name, description, price, category,  featured, metadata)
SELECT t.id, 'NN-TACOS-PASTOR', 'Tacos de Pastor (3 pzs)', 'Tres tacos de pastor con piña asada, cebolla, cilantro y salsa verde', 85.00, 'tacos', true,
  '{"image": "🌮", "piezas": 3, "guisado": "Pastor", "incluye": ["Piña asada", "Cebolla", "Cilantro", "Limón", "Salsas"], "picante": "Medio", "tortilla": "Maíz artesanal"}'::jsonb
FROM tenants t WHERE t.slug = 'nom-nom'
UNION ALL
SELECT t.id, 'NN-TACOS-CARNITAS', 'Tacos de Carnitas (3 pzs)', 'Tres tacos de carnitas estilo Michoacán con cebolla, cilantro y salsa roja', 90.00, 'tacos', true,
  '{"image": "🌮", "piezas": 3, "guisado": "Carnitas", "estilo": "Michoacán", "incluye": ["Cebolla", "Cilantro", "Limón", "Salsas"], "tortilla": "Maíz"}'::jsonb
FROM tenants t WHERE t.slug = 'nom-nom'
UNION ALL
SELECT t.id, 'NN-TACOS-BISTEC', 'Tacos de Bistec (3 pzs)', 'Tres tacos de bistec asado con cebolla, cilantro, aguacate y salsa', 95.00, 'tacos', true,
  '{"image": "🥩", "piezas": 3, "guisado": "Bistec asado", "incluye": ["Cebolla asada", "Cilantro", "Aguacate", "Limón", "Salsas"]}'::jsonb
FROM tenants t WHERE t.slug = 'nom-nom'
UNION ALL
SELECT t.id, 'NN-QUESADILLA-QUESO', 'Quesadilla de Queso Oaxaca', 'Quesadilla grande con queso Oaxaca fundido en tortilla de maíz azul', 65.00, 'quesadillas', true,
  '{"image": "🧀", "queso": "Oaxaca", "tortilla": "Maíz azul artesanal", "tamano": "Grande", "incluye": ["Salsa verde", "Salsa roja"]}'::jsonb
FROM tenants t WHERE t.slug = 'nom-nom'
UNION ALL
SELECT t.id, 'NN-TORTA-MILANESA', 'Torta de Milanesa', 'Torta de milanesa de res con frijoles, aguacate, tomate, cebolla, jalapeños y mayonesa', 110.00, 'tortas', false,
  '{"image": "🥖", "proteina": "Milanesa de res", "incluye": ["Frijoles", "Aguacate", "Tomate", "Cebolla", "Jalapeños", "Mayonesa", "Pan telera tostado"]}'::jsonb
FROM tenants t WHERE t.slug = 'nom-nom';

-- =====================================================
-- STAFF
-- =====================================================

-- WONDER NAILS Staff
INSERT INTO staff (tenant_id, name, role, email, phone, specialties, photo, active, metadata)
SELECT t.id, 'Marialicia Villafuerte Hurtado', 'Dueña y Especialista Principal', 'marialiciavh1984@gmail.mx', '+52 1 55 6406 8409', '["manicure", "pedicure", "nail-art", "gel-extensions"]'::jsonb, '/staff/marialicia.jpg', true,
  '{"experience_years": 8, "certifications": ["OPI Certified", "CND Certified"], "languages": ["español", "inglés"], "specialties_detail": ["Uñas acrílicas", "Nail art personalizado", "Manicure spa", "Pedicure médico"]}'::jsonb
FROM tenants t WHERE t.slug = 'wondernails'

UNION ALL

-- VIGI STUDIO Staff
SELECT t.id, 'Marialicia Villafuerte', 'Manicurista', 'marialicia@vigistudio.mx', '+525621990000', '["manicure", "pedicure", "nail-art"]'::jsonb, '/staff/marialicia-vigi.jpg', true,
  '{"experience_years": 6, "specialties_detail": ["Manicure profesional", "Pedicure spa", "Nail art"]}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio'

UNION ALL
SELECT t.id, 'Viridiana', 'Especialista en Depilación Láser', 'viridiana@vigistudio.mx', '+525621990001', '["depilacion-laser", "depilacion-tradicional"]'::jsonb, '/staff/viridiana.jpg', true,
  '{"experience_years": 5, "certifications": ["Laser Certified"], "specialties_detail": ["Depilación láser", "Tratamientos de piel"]}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio'

UNION ALL
SELECT t.id, 'Ivonne', 'Esteticista', 'ivonne@vigistudio.mx', '+525621990002', '["estetica-facial", "tratamientos-piel", "limpiezas"]'::jsonb, '/staff/ivonne.jpg', true,
  '{"experience_years": 7, "specialties_detail": ["Estética facial", "Limpiezas profundas", "Tratamientos anti-edad"]}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio'

UNION ALL
SELECT t.id, 'Gina', 'Masajista', 'gina@vigistudio.mx', '+525621990003', '["masajes", "terapia-relajante", "reflexologia"]'::jsonb, '/staff/gina.jpg', true,
  '{"experience_years": 4, "specialties_detail": ["Masajes relajantes", "Terapia de relajación", "Reflexología"]}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio'

UNION ALL

-- CENTRO TENÍSTICO Staff
SELECT t.id, 'Manlio Villafuerte', 'Instructor Principal', 'manlio@tenisticoelite.mx', '+52 1 595 116 3490', '["tenis-individual", "entrenamiento-avanzado", "tecnica"]'::jsonb, '/staff/manlio.jpg', true,
  '{"experience_years": 12, "certifications": ["PTR Certified"], "specialties_detail": ["Entrenamiento individual", "Técnica avanzada", "Competencia"]}'::jsonb
FROM tenants t WHERE t.slug = 'centro-tenistico'

UNION ALL
SELECT t.id, 'Sergio Villafuerte', 'Instructor Asistente', 'sergio@tenisticoelite.mx', '+525536901478', '["tenis-grupal", "entrenamiento-principiantes", "condicionamiento"]'::jsonb, '/staff/sergio.jpg', true,
  '{"experience_years": 8, "specialties_detail": ["Clases grupales", "Principiantes", "Condicionamiento físico"], "location": "Texcoco, Estado de México"}'::jsonb
FROM tenants t WHERE t.slug = 'centro-tenistico'

UNION ALL

-- DELIRIOS Staff
SELECT t.id, 'Fernando Villafuerte', 'Chef Ejecutivo', 'fernando@delirios.mx', '+52 1 56 1079 9217', '["cocina-saludable", "nutricion", "entrenador-personal"]'::jsonb, '/staff/fernando.jpg', true,
  '{"experience_years": 10, "certifications": ["Chef Saludable"], "specialties_detail": ["Cocina saludable", "Nutrición deportiva", "Planes alimenticios"], "location": "Distrito Federal"}'::jsonb
FROM tenants t WHERE t.slug = 'delirios';

-- =====================================================
-- SERVICES
-- =====================================================

-- WONDER NAILS Services
INSERT INTO services (tenant_id, name, description, price, duration, featured, metadata)
SELECT t.id, 'Manicure Gel Completo', 'Manicure completo con aplicación de gel UV de larga duración - Incluye limado, cutícula, masaje y esmaltado', 450.00, 90, true,
  '{"image": "💅", "incluye": ["Limado y forma", "Cuidado de cutícula", "Pulido", "Gel UV esmaltado", "Masaje de manos", "Hidratación"], "duracion_gel": "21 días", "colores_disponibles": "200+"}'::jsonb
FROM tenants t WHERE t.slug = 'wondernails'
UNION ALL
SELECT t.id, 'Pedicure Spa Deluxe', 'Pedicure spa deluxe con exfoliación, mascarilla, masaje y esmaltado gel', 550.00, 120, true,
  '{"image": "🦶", "incluye": ["Baño de pies con sales", "Exfoliación", "Mascarilla hidratante", "Limado profesional", "Cutícula", "Gel esmaltado", "Masaje piernas y pies"], "productos": "Profesionales OPI/CND"}'::jsonb
FROM tenants t WHERE t.slug = 'wondernails'
UNION ALL
SELECT t.id, 'Nail Art Diseño Básico', 'Diseño de uñas artístico básico - 5 uñas con detalle', 200.00, 45, false,
  '{"image": "🎨", "cantidad_unas": 5, "complejidad": "Básica", "incluye": ["Diseños geométricos", "Líneas", "Puntos", "Francés decorado"]}'::jsonb
FROM tenants t WHERE t.slug = 'wondernails'
UNION ALL
SELECT t.id, 'Uñas Acrílicas Esculpidas', 'Aplicación de uñas acrílicas esculpidas con forma personalizada y esmaltado', 800.00, 150, true,
  '{"image": "💎", "tecnica": "Esculpido", "incluye": ["Preparación", "Esculpido completo", "Forma a elegir", "Limado perfecto", "Esmaltado gel"], "formas": ["Almendra", "Cuadrada", "Stiletto", "Coffin"]}'::jsonb
FROM tenants t WHERE t.slug = 'wondernails';

-- VIGI STUDIO Services
INSERT INTO services (tenant_id, name, description, price, duration, featured, metadata)
SELECT t.id, 'Corte y Styling Premium', 'Corte de cabello con lavado, tratamiento acondicionador, corte personalizado y styling profesional', 550.00, 90, true,
  '{"image": "✂️", "incluye": ["Lavado con productos premium", "Diagnóstico capilar", "Corte personalizado", "Styling profesional", "Productos de acabado"], "productos": "Kérastase"}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio'
UNION ALL
SELECT t.id, 'Color Completo Profesional', 'Coloración completa con productos profesionales L''Oréal Professionnel', 1200.00, 180, true,
  '{"image": "🎨", "incluye": ["Diagnóstico de color", "Aplicación completa", "Tratamiento post-color", "Lavado y secado", "Styling"], "marca": "L''Oréal Professionnel", "garantia": "Retoque de raíz 30 días"}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio'
UNION ALL
SELECT t.id, 'Tratamiento Kerastase Fusio-Dose', 'Tratamiento capilar personalizado Fusio-Dose con tecnología booster', 650.00, 60, true,
  '{"image": "💆", "marca": "Kérastase", "tecnologia": "Fusio-Dose", "incluye": ["Diagnóstico", "Aplicación booster", "Masaje capilar", "Lavado y styling"], "beneficios": ["Nutrición profunda", "Reparación", "Brillo intenso"]}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio'
UNION ALL
SELECT t.id, 'Peinado para Evento', 'Peinado profesional para eventos especiales - Incluye prueba previa', 850.00, 120, false,
  '{"image": "👰", "incluye": ["Consulta", "Prueba de peinado", "Peinado día del evento", "Fijación profesional"], "ocasiones": ["Bodas", "Graduaciones", "Eventos sociales"]}'::jsonb
FROM tenants t WHERE t.slug = 'vigistudio';

-- CENTRO TENÍSTICO Services
INSERT INTO services (tenant_id, name, description, price, duration, featured, metadata)
SELECT t.id, 'Clase Individual de Tenis', 'Clase privada de tenis con instructor certificado - Incluye cancha y pelotas', 800.00, 60, true,
  '{"image": "🎾", "incluye": ["Instructor certificado", "Cancha premium", "Pelotas Penn", "Análisis de juego", "Plan de mejora"], "nivel": ["Principiante", "Intermedio", "Avanzado"]}'::jsonb
FROM tenants t WHERE t.slug = 'centro-tenistico'
UNION ALL
SELECT t.id, 'Clase Grupal Tenis (4 personas)', 'Clase de tenis en grupo pequeño - Máximo 4 personas', 350.00, 90, true,
  '{"image": "👥", "maximo_personas": 4, "incluye": ["Instructor", "Cancha", "Pelotas", "Ejercicios grupales"], "ideal_para": "Principiantes e intermedios"}'::jsonb
FROM tenants t WHERE t.slug = 'centro-tenistico'
UNION ALL
SELECT t.id, 'Renta de Cancha por Hora', 'Renta de cancha de tenis profesional con iluminación', 250.00, 60, false,
  '{"image": "🏟️", "tipo_cancha": "Dura profesional", "iluminacion": "LED incluida", "incluye": "Cancha completa", "horario": "6:00-22:00"}'::jsonb
FROM tenants t WHERE t.slug = 'centro-tenistico'
UNION ALL
SELECT t.id, 'Clínica de Tenis Fin de Semana', 'Clínica intensiva de tenis - Sábado y Domingo 2 horas diarias', 2500.00, 240, true,
  '{"image": "🏆", "duracion_total": "4 horas", "dias": ["Sábado", "Domingo"], "incluye": ["Entrenamiento técnico", "Tácticas de juego", "Acondicionamiento físico", "Sparring"], "nivel": "Intermedio-Avanzado"}'::jsonb
FROM tenants t WHERE t.slug = 'centro-tenistico';

-- DELIRIOS Services (Catering y Planes)
INSERT INTO services (tenant_id, name, description, price, duration, featured, metadata)
SELECT t.id, 'Plan Semanal Saludable', 'Plan de comida saludable para 5 días - 2 comidas diarias (comida y cena)', 1850.00, 7200, true,
  '{"image": "📅", "duracion": "5 días", "comidas_dia": 2, "total_comidas": 10, "incluye": ["Menú balanceado", "Entrega diaria", "Asesoría nutricional", "Personalización"], "calorias_dia": "1200-1800", "delivery": "Gratis CDMX"}'::jsonb
FROM tenants t WHERE t.slug = 'delirios'
UNION ALL
SELECT t.id, 'Catering Saludable Eventos', 'Servicio de catering saludable para eventos - Desde 20 personas', 450.00, 180, true,
  '{"image": "🎉", "minimo_personas": 20, "precio_por_persona": true, "incluye": ["Montaje", "Servicio", "Cristalería", "Bebidas"], "opciones": ["Bowls", "Ensaladas", "Wraps", "Postres healthy"]}'::jsonb
FROM tenants t WHERE t.slug = 'delirios';

-- NOM NOM Services (Delivery & Catering)
INSERT INTO services (tenant_id, name, description, price, duration, featured, metadata)
SELECT t.id, 'Taquiza para 10 Personas', 'Taquiza completa para 10 personas - 30 tacos surtidos con guarniciones', 850.00, 240, true,
  '{"image": "🎊", "personas": 10, "tacos": 30, "guisados": ["Pastor", "Bistec", "Carnitas"], "incluye": ["Salsas variadas", "Cebolla", "Cilantro", "Limones", "Tortillas extra", "Frijoles", "Arroz"], "setup": "Opcional +200"}'::jsonb
FROM tenants t WHERE t.slug = 'nom-nom'
UNION ALL
SELECT t.id, 'Delivery Express', 'Servicio de entrega a domicilio rápido - 30-45 minutos', 45.00, 30, false,
  '{"image": "🛵", "tiempo_estimado": "30-45 min", "zona": "5km radio", "gratis_con_compra": "$200+", "rastreo": "En tiempo real"}'::jsonb
FROM tenants t WHERE t.slug = 'nom-nom';

COMMIT;
