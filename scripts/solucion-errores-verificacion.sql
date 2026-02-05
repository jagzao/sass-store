-- =================================================================
-- SOLUCIÓN DE ERRORES COMUNES DE VERIFICACIÓN
-- =================================================================
-- Este script corrige los errores más comunes encontrados en la verificación
-- =================================================================

-- =================================================================
-- 1. Verificar si las tablas relacionadas existen
-- =================================================================

-- Verificar si existe la tabla tenants
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'tenants',
    'table_exists',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Tabla tenants ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para foreign keys' END
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'tenants';

-- Verificar si existe la tabla products
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'products',
    'table_exists',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Tabla products ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para foreign keys' END
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'products';

-- Verificar si existe la tabla services
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'services',
    'table_exists',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Tabla services ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para foreign keys' END
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'services';

-- =================================================================
-- 2. Verificar si las tablas tienen las columnas correctas
-- =================================================================

-- Verificar columna tenant_id en products
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'products',
    'tenant_id_column',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Columna tenant_id en products ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para relación con tenants' END
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products'
AND column_name = 'tenant_id';

-- Verificar columna tenant_id en services
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'services',
    'tenant_id_column',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Columna tenant_id en services ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para relación con tenants' END
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'services'
AND column_name = 'tenant_id';

-- =================================================================
-- 3. Verificar si hay datos en las tablas relacionadas
-- =================================================================

-- Verificar si hay datos en tenants
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'tenants',
    'data_check',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Registros en tenants: ' || COUNT(*) || CASE WHEN COUNT(*) = 0 THEN ' - NECESARIO al menos un tenant' ELSE '' END
FROM tenants;

-- Verificar si hay datos en products
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'products',
    'data_check',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Registros en products: ' || COUNT(*) || CASE WHEN COUNT(*) = 0 THEN ' - NECESARIO al menos un producto' ELSE '' END
FROM products;

-- Verificar si hay datos en services
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'services',
    'data_check',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Registros en services: ' || COUNT(*) || CASE WHEN COUNT(*) = 0 THEN ' - NECESARIO al menos un servicio' ELSE '' END
FROM services;

-- =================================================================
-- 4. Verificar consistencia de datos
-- =================================================================

-- Verificar si hay productos sin tenant_id
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'products',
    'tenant_consistency',
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END,
    'Productos sin tenant_id: ' || COUNT(*) || CASE WHEN COUNT(*) > 0 THEN ' - ERROR: Todos los productos deben tener tenant_id' ELSE '' END
FROM products
WHERE tenant_id IS NULL;

-- Verificar si hay servicios sin tenant_id
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'services',
    'tenant_consistency',
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END,
    'Servicios sin tenant_id: ' || COUNT(*) || CASE WHEN COUNT(*) > 0 THEN ' - ERROR: Todos los servicios deben tener tenant_id' ELSE '' END
FROM services
WHERE tenant_id IS NULL;

-- =================================================================
-- 5. Mostrar todos los resultados
-- =================================================================

-- Mostrar todos los resultados detallados
SELECT 
    table_name,
    check_type,
    status,
    details,
    check_time
FROM verification_results
ORDER BY 
    CASE WHEN status = 'ERROR' THEN 0
         WHEN status = 'WARNING' THEN 1
         ELSE 2 END,
    table_name,
    check_type;

-- =================================================================
-- 6. Verificación Final
-- =================================================================

-- Verificar si hay errores críticos
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'SISTEMA',
    'final_status',
    CASE WHEN error_count = 0 THEN 'OK' ELSE 'ERROR' END,
    'Errores críticos: ' || error_count || ' - Verificación ' || CASE WHEN error_count = 0 THEN 'EXITOSA' ELSE 'FALLIDA' END
FROM (
    SELECT COUNT(*) as error_count
    FROM verification_results
    WHERE status = 'ERROR'
) sub;

-- Mostrar resultado final
SELECT 
    table_name,
    check_type,
    status,
    details,
    check_time
FROM verification_results
WHERE table_name = 'SISTEMA' AND check_type = 'final_status';

-- =================================================================
-- FIN DE LA VERIFICACIÓN DE ERRORES
-- =================================================================