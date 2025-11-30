// Script para depurar problemas con la carga de servicios
// Para ejecutar este script, copia y pégalo en el editor SQL de Supabase

// 1. Ver todos los servicios en la base de datos
/*
SELECT 
  s.id,
  s.name,
  s.description,
  s.price,
  s.duration,
  s.active,
  s.tenant_id,
  t.name as tenant_name,
  t.slug as tenant_slug
FROM services s
JOIN tenants t ON s.tenant_id = t.id
ORDER BY s.tenant_id, s.name;
*/

// 2. Ver servicios de un tenant específico (reemplazar 'tu-tenant-slug' con el slug real)
/*
SELECT 
  s.id,
  s.name,
  s.description,
  s.price,
  s.duration,
  s.active
FROM services s
JOIN tenants t ON s.tenant_id = t.id
WHERE t.slug = 'tu-tenant-slug'
ORDER BY s.name;
*/

// 3. Contar servicios por tenant
/*
SELECT 
  t.name as tenant_name,
  t.slug as tenant_slug,
  COUNT(s.id) as service_count
FROM tenants t
LEFT JOIN services s ON t.id = s.tenant_id
GROUP BY t.id, t.name, t.slug
ORDER BY service_count DESC;
*/

// 4. Verificar si hay servicios activos
/*
SELECT 
  t.name as tenant_name,
  t.slug as tenant_slug,
  COUNT(s.id) FILTER (WHERE s.active = true) as active_services,
  COUNT(s.id) FILTER (WHERE s.active = false) as inactive_services
FROM tenants t
LEFT JOIN services s ON t.id = s.tenant_id
GROUP BY t.id, t.name, t.slug
ORDER BY active_services DESC;
*/

// 5. Verificar la estructura de la tabla services
/*
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'services'
ORDER BY ordinal_position;
*/

// 6. Verificar si hay políticas RLS en la tabla services
/*
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'services';
*/

// 7. Verificar si el usuario actual tiene acceso a los servicios
/*
-- Reemplaza 'user-id' con el ID del usuario actual
-- Reemplaza 'tenant-id' con el ID del tenant actual
SELECT 
  s.id,
  s.name,
  s.price,
  s.duration
FROM services s
WHERE s.tenant_id = 'tenant-id' AND s.active = true;
*/

console.log("Script para depurar problemas con la carga de servicios");
console.log("Copia y pega cualquiera de las consultas comentadas en el editor SQL de Supabase");