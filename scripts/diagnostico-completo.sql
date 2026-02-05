-- =================================================================
-- DIAGNÓSTICO COMPLETO - TODOS LOS ERRORES EN UNA SOLA CONSULTA
-- =================================================================
-- Este script muestra todos los posibles errores en una sola tabla de resultados
-- =================================================================

WITH diagnosticos AS (
    -- 1. Verificar si las tablas relacionadas existen
    SELECT 
        'tenants' as table_name,
        'table_exists' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Tabla tenants ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para foreign keys' END as details
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants'
    
    UNION ALL
    
    SELECT 
        'products' as table_name,
        'table_exists' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Tabla products ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para foreign keys' END as details
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'products'
    
    UNION ALL
    
    SELECT 
        'services' as table_name,
        'table_exists' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Tabla services ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para foreign keys' END as details
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'services'
    
    UNION ALL
    
    -- 2. Verificar si las tablas tienen las columnas correctas
    SELECT 
        'products' as table_name,
        'tenant_id_column' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Columna tenant_id en products ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para relación con tenants' END as details
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products'
    AND column_name = 'tenant_id'
    
    UNION ALL
    
    SELECT 
        'services' as table_name,
        'tenant_id_column' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Columna tenant_id en services ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe - NECESARIA para relación con tenants' END as details
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'services'
    AND column_name = 'tenant_id'
    
    UNION ALL
    
    -- 3. Verificar si hay datos en las tablas relacionadas
    SELECT 
        'tenants' as table_name,
        'data_check' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Registros en tenants: ' || COUNT(*) || CASE WHEN COUNT(*) = 0 THEN ' - NECESARIO al menos un tenant' ELSE '' END as details
    FROM tenants
    
    UNION ALL
    
    SELECT 
        'products' as table_name,
        'data_check' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Registros en products: ' || COUNT(*) || CASE WHEN COUNT(*) = 0 THEN ' - NECESARIO al menos un producto' ELSE '' END as details
    FROM products
    
    UNION ALL
    
    SELECT 
        'services' as table_name,
        'data_check' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Registros en services: ' || COUNT(*) || CASE WHEN COUNT(*) = 0 THEN ' - NECESARIO al menos un servicio' ELSE '' END as details
    FROM services
    
    UNION ALL
    
    -- 4. Verificar consistencia de datos
    SELECT 
        'products' as table_name,
        'tenant_consistency' as check_type,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Productos sin tenant_id: ' || COUNT(*) || CASE WHEN COUNT(*) > 0 THEN ' - ERROR: Todos los productos deben tener tenant_id' ELSE '' END as details
    FROM products
    WHERE tenant_id IS NULL
    
    UNION ALL
    
    SELECT 
        'services' as table_name,
        'tenant_consistency' as check_type,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Servicios sin tenant_id: ' || COUNT(*) || CASE WHEN COUNT(*) > 0 THEN ' - ERROR: Todos los servicios deben tener tenant_id' ELSE '' END as details
    FROM services
    WHERE tenant_id IS NULL
    
    UNION ALL
    
    -- 5. Verificar tablas de inventario creadas
    SELECT 
        'product_inventory' as table_name,
        'table_exists' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Tabla product_inventory ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END as details
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_inventory'
    
    UNION ALL
    
    SELECT 
        'service_products' as table_name,
        'table_exists' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Tabla service_products ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END as details
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_products'
    
    UNION ALL
    
    SELECT 
        'inventory_transactions' as table_name,
        'table_exists' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Tabla inventory_transactions ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END as details
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inventory_transactions'
    
    UNION ALL
    
    SELECT 
        'inventory_alerts' as table_name,
        'table_exists' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Tabla inventory_alerts ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END as details
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inventory_alerts'
    
    UNION ALL
    
    SELECT 
        'product_alert_config' as table_name,
        'table_exists' as check_type,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
        'Tabla product_alert_config ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END as details
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'product_alert_config'
)
-- Mostrar todos los resultados ordenados por prioridad
SELECT 
    table_name,
    check_type,
    status,
    details
FROM diagnosticos
ORDER BY 
    CASE WHEN status = 'ERROR' THEN 0
         WHEN status = 'WARNING' THEN 1
         ELSE 2 END,
    table_name,
    check_type;

-- =================================================================
-- FIN DEL DIAGNÓSTICO COMPLETO
-- =================================================================