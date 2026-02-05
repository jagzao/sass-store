-- =================================================================
-- DIAGNÓSTICO SIMPLE - ERRORES COMUNES EN SISTEMA DE INVENTARIO
-- =================================================================
-- Este script verifica los errores más comunes sin usar tablas temporales
-- =================================================================

-- =================================================================
-- 1. Verificar si las tablas relacionadas existen
-- =================================================================

-- Verificar si existe la tabla tenants
SELECT 
    'tenants' as table_name,
    'table_exists' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Tabla tenants ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para foreign keys' END as details
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'tenants';

-- Verificar si existe la tabla products
SELECT 
    'products' as table_name,
    'table_exists' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Tabla products ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para foreign keys' END as details
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'products';

-- Verificar si existe la tabla services
SELECT 
    'services' as table_name,
    'table_exists' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Tabla services ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para foreign keys' END as details
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'services';

-- =================================================================
-- 2. Verificar si las tablas tienen las columnas correctas
-- =================================================================

-- Verificar columna tenant_id en products
SELECT 
    'products' as table_name,
    'tenant_id_column' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Columna tenant_id en products ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para relación con tenants' END as details
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products'
AND column_name = 'tenant_id';

-- Verificar columna tenant_id en services
SELECT 
    'services' as table_name,
    'tenant_id_column' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Columna tenant_id en services ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para relación con tenants' END as details
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'services'
AND column_name = 'tenant_id';

-- =================================================================
-- 3. Verificar si hay datos en las tablas relacionadas
-- =================================================================

-- Verificar si hay datos en tenants
SELECT 
    'tenants' as table_name,
    'data_check' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Registros en tenants: ' || COUNT(*) || CASE WHEN COUNT(*) = 0 THEN ' - NECESARIO al menos un tenant' ELSE '' END as details
FROM tenants;

-- Verificar si hay datos en products
SELECT 
    'products' as table_name,
    'data_check' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Registros en products: ' || COUNT(*) || CASE WHEN COUNT(*) = 0 THEN ' - NECESARIO al menos un producto' ELSE '' END as details
FROM products;

-- Verificar si hay datos en services
SELECT 
    'services' as table_name,
    'data_check' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Registros en services: ' || COUNT(*) || CASE WHEN COUNT(*) = 0 THEN ' - NECESARIO al menos un servicio' ELSE '' END as details
FROM services;

-- =================================================================
-- 4. Verificar consistencia de datos
-- =================================================================

-- Verificar si hay productos sin tenant_id
SELECT 
    'products' as table_name,
    'tenant_consistency' as check_type,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Productos sin tenant_id: ' || COUNT(*) || CASE WHEN COUNT(*) > 0 THEN ' - ERROR: Todos los productos deben tener tenant_id' ELSE '' END as details
FROM products
WHERE tenant_id IS NULL;

-- Verificar si hay servicios sin tenant_id
SELECT 
    'services' as table_name,
    'tenant_consistency' as check_type,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Servicios sin tenant_id: ' || COUNT(*) || CASE WHEN COUNT(*) > 0 THEN ' - ERROR: Todos los servicios deben tener tenant_id' ELSE '' END as details
FROM services
WHERE tenant_id IS NULL;

-- =================================================================
-- 5. Verificar tablas de inventario creadas
-- =================================================================

-- Verificar tabla product_inventory
SELECT 
    'product_inventory' as table_name,
    'table_exists' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Tabla product_inventory ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END as details
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'product_inventory';

-- Verificar tabla service_products
SELECT 
    'service_products' as table_name,
    'table_exists' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Tabla service_products ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END as details
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'service_products';

-- Verificar tabla inventory_transactions
SELECT 
    'inventory_transactions' as table_name,
    'table_exists' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Tabla inventory_transactions ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END as details
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'inventory_transactions';

-- Verificar tabla inventory_alerts
SELECT 
    'inventory_alerts' as table_name,
    'table_exists' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Tabla inventory_alerts ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END as details
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'inventory_alerts';

-- Verificar tabla product_alert_config
SELECT 
    'product_alert_config' as table_name,
    'table_exists' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    'Tabla product_alert_config ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END as details
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'product_alert_config';

-- =================================================================
-- FIN DEL DIAGNÓSTICO
-- =================================================================