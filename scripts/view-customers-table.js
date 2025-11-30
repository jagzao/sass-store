// Script para ver la tabla de clientes en Supabase
// Para ejecutar este script, copia y pégalo en el editor SQL de Supabase

// 1. Ver todos los clientes
/*
SELECT * FROM customers ORDER BY created_at DESC;
*/

// 2. Ver clientes con información del tenant
/*
SELECT 
  c.id,
  c.name,
  c.phone,
  c.email,
  c.status,
  c.tags,
  c.created_at,
  t.name as tenant_name,
  t.slug as tenant_slug
FROM customers c
JOIN tenants t ON c.tenant_id = t.id
ORDER BY c.created_at DESC;
*/

// 3. Ver clientes de un tenant específico (reemplazar 'tu-tenant-slug' con el slug real)
/*
SELECT 
  c.id,
  c.name,
  c.phone,
  c.email,
  c.status,
  c.tags,
  c.created_at
FROM customers c
JOIN tenants t ON c.tenant_id = t.id
WHERE t.slug = 'tu-tenant-slug'
ORDER BY c.created_at DESC;
*/

// 4. Contar clientes por tenant
/*
SELECT 
  t.name as tenant_name,
  t.slug as tenant_slug,
  COUNT(c.id) as customer_count
FROM tenants t
LEFT JOIN customers c ON t.id = c.tenant_id
GROUP BY t.id, t.name, t.slug
ORDER BY customer_count DESC;
*/

// 5. Ver últimos 10 clientes registrados
/*
SELECT 
  c.id,
  c.name,
  c.phone,
  c.email,
  c.status,
  c.created_at,
  t.name as tenant_name
FROM customers c
JOIN tenants t ON c.tenant_id = t.id
ORDER BY c.created_at DESC
LIMIT 10;
*/

// 6. Ver clientes con sus visitas
/*
SELECT 
  c.id,
  c.name,
  c.phone,
  COUNT(cv.id) as visit_count,
  MAX(cv.visit_date) as last_visit
FROM customers c
LEFT JOIN customer_visits cv ON c.id = cv.customer_id
GROUP BY c.id, c.name, c.phone
ORDER BY visit_count DESC;
*/

// 7. Ver estructura de la tabla customers
/*
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'customers'
ORDER BY ordinal_position;
*/

console.log("Script para ver la tabla de clientes en Supabase");
console.log("Copia y pega cualquiera de las consultas comentadas en el editor SQL de Supabase");