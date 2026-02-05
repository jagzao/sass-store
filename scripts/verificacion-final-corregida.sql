-- =================================================================
-- VERIFICACIÓN FINAL CORREGIDA - SISTEMA DE INVENTARIO
-- =================================================================
-- Este script verifica que todo el sistema de inventario esté correctamente creado
-- Versión corregida sin tablas temporales y con GROUP BY correcto
-- =================================================================

-- Crear una tabla temporal para almacenar los resultados
CREATE TEMPORARY TABLE verification_results (
    table_name VARCHAR(100),
    check_type VARCHAR(100),
    status VARCHAR(20),
    details TEXT,
    check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- 1. Verificar Tablas Creadas
-- =================================================================

-- Verificar tabla product_inventory
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_inventory',
    'table_exists',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Tabla ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'product_inventory';

-- Verificar tabla service_products
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'service_products',
    'table_exists',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Tabla ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'service_products';

-- Verificar tabla inventory_transactions
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_transactions',
    'table_exists',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Tabla ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'inventory_transactions';

-- Verificar tabla inventory_alerts
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_alerts',
    'table_exists',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Tabla ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'inventory_alerts';

-- Verificar tabla product_alert_config
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_alert_config',
    'table_exists',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Tabla ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'product_alert_config';

-- =================================================================
-- 2. Verificar Columnas Importantes
-- =================================================================

-- Verificar columnas de product_inventory
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_inventory',
    'columns_check',
    CASE WHEN COUNT(*) >= 10 THEN 'OK' ELSE 'ERROR' END,
    'Columnas encontradas: ' || COUNT(*) || ' (mínimo 10 esperadas)'
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'product_inventory'
AND column_name IN ('id', 'tenant_id', 'product_id', 'quantity', 'reorder_level', 'reorder_quantity', 'unit_cost', 'location', 'metadata', 'created_at', 'updated_at');

-- Verificar columnas de service_products
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'service_products',
    'columns_check',
    CASE WHEN COUNT(*) >= 8 THEN 'OK' ELSE 'ERROR' END,
    'Columnas encontradas: ' || COUNT(*) || ' (mínimo 8 esperadas)'
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'service_products'
AND column_name IN ('id', 'tenant_id', 'service_id', 'product_id', 'quantity', 'optional', 'metadata', 'created_at', 'updated_at');

-- Verificar columnas de inventory_transactions
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_transactions',
    'columns_check',
    CASE WHEN COUNT(*) >= 12 THEN 'OK' ELSE 'ERROR' END,
    'Columnas encontradas: ' || COUNT(*) || ' (mínimo 12 esperadas)'
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'inventory_transactions'
AND column_name IN ('id', 'tenant_id', 'product_id', 'type', 'quantity', 'previous_quantity', 'new_quantity', 'reference_type', 'reference_id', 'notes', 'user_id', 'metadata', 'created_at');

-- Verificar columnas de inventory_alerts
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_alerts',
    'columns_check',
    CASE WHEN COUNT(*) >= 13 THEN 'OK' ELSE 'ERROR' END,
    'Columnas encontradas: ' || COUNT(*) || ' (mínimo 13 esperadas)'
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'inventory_alerts'
AND column_name IN ('id', 'tenant_id', 'product_id', 'alert_type', 'severity', 'threshold', 'current_value', 'status', 'acknowledged_by', 'acknowledged_at', 'resolved_at', 'notes', 'metadata', 'created_at', 'updated_at');

-- Verificar columnas de product_alert_config
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_alert_config',
    'columns_check',
    CASE WHEN COUNT(*) >= 11 THEN 'OK' ELSE 'ERROR' END,
    'Columnas encontradas: ' || COUNT(*) || ' (mínimo 11 esperadas)'
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'product_alert_config'
AND column_name IN ('id', 'tenant_id', 'product_id', 'low_stock_threshold', 'low_stock_enabled', 'out_of_stock_enabled', 'overstock_threshold', 'overstock_enabled', 'expiry_warning_days', 'expiry_warning_enabled', 'email_notifications', 'metadata', 'created_at', 'updated_at');

-- =================================================================
-- 3. Verificar Índices
-- =================================================================

-- Verificar índices de product_inventory
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_inventory',
    'indexes_check',
    CASE WHEN COUNT(*) >= 5 THEN 'OK' ELSE 'ERROR' END,
    'Índices encontrados: ' || COUNT(*) || ' (mínimo 5 esperados)'
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'product_inventory';

-- Verificar índices de service_products
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'service_products',
    'indexes_check',
    CASE WHEN COUNT(*) >= 5 THEN 'OK' ELSE 'ERROR' END,
    'Índices encontrados: ' || COUNT(*) || ' (mínimo 5 esperados)'
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'service_products';

-- Verificar índices de inventory_transactions
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_transactions',
    'indexes_check',
    CASE WHEN COUNT(*) >= 7 THEN 'OK' ELSE 'ERROR' END,
    'Índices encontrados: ' || COUNT(*) || ' (mínimo 7 esperados)'
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'inventory_transactions';

-- Verificar índices de inventory_alerts
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_alerts',
    'indexes_check',
    CASE WHEN COUNT(*) >= 8 THEN 'OK' ELSE 'ERROR' END,
    'Índices encontrados: ' || COUNT(*) || ' (mínimo 8 esperados)'
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'inventory_alerts';

-- Verificar índices de product_alert_config
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_alert_config',
    'indexes_check',
    CASE WHEN COUNT(*) >= 3 THEN 'OK' ELSE 'ERROR' END,
    'Índices encontrados: ' || COUNT(*) || ' (mínimo 3 esperados)'
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'product_alert_config';

-- =================================================================
-- 4. Verificar RLS (Row Level Security)
-- =================================================================

-- Verificar RLS habilitado en las tablas
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_inventory',
    'rls_enabled',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'RLS ' || CASE WHEN COUNT(*) > 0 THEN 'habilitado' ELSE 'NO habilitado' END
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'product_inventory'
AND rowsecurity = true;

INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'service_products',
    'rls_enabled',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'RLS ' || CASE WHEN COUNT(*) > 0 THEN 'habilitado' ELSE 'NO habilitado' END
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'service_products'
AND rowsecurity = true;

INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_transactions',
    'rls_enabled',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'RLS ' || CASE WHEN COUNT(*) > 0 THEN 'habilitado' ELSE 'NO habilitado' END
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'inventory_transactions'
AND rowsecurity = true;

INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_alerts',
    'rls_enabled',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'RLS ' || CASE WHEN COUNT(*) > 0 THEN 'habilitado' ELSE 'NO habilitado' END
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'inventory_alerts'
AND rowsecurity = true;

INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_alert_config',
    'rls_enabled',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'RLS ' || CASE WHEN COUNT(*) > 0 THEN 'habilitado' ELSE 'NO habilitado' END
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'product_alert_config'
AND rowsecurity = true;

-- =================================================================
-- 5. Verificar Políticas RLS
-- =================================================================

-- Verificar políticas RLS para product_inventory
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_inventory',
    'rls_policies',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Políticas RLS encontradas: ' || COUNT(*) || ' (mínimo 1 esperada)'
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'product_inventory';

-- Verificar políticas RLS para service_products
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'service_products',
    'rls_policies',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Políticas RLS encontradas: ' || COUNT(*) || ' (mínimo 1 esperada)'
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'service_products';

-- Verificar políticas RLS para inventory_transactions
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_transactions',
    'rls_policies',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Políticas RLS encontradas: ' || COUNT(*) || ' (mínimo 1 esperada)'
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'inventory_transactions';

-- Verificar políticas RLS para inventory_alerts
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_alerts',
    'rls_policies',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Políticas RLS encontradas: ' || COUNT(*) || ' (mínimo 1 esperada)'
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'inventory_alerts';

-- Verificar políticas RLS para product_alert_config
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_alert_config',
    'rls_policies',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Políticas RLS encontradas: ' || COUNT(*) || ' (mínimo 1 esperada)'
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'product_alert_config';

-- =================================================================
-- 6. Verificar Triggers
-- =================================================================

-- Verificar triggers de actualización de timestamp
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_inventory',
    'timestamp_triggers',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Trigger de timestamp ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END
FROM pg_trigger 
WHERE tgrelid = 'product_inventory'::regclass
AND tgname = 'update_product_inventory_updated_at';

INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'service_products',
    'timestamp_triggers',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Trigger de timestamp ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END
FROM pg_trigger 
WHERE tgrelid = 'service_products'::regclass
AND tgname = 'update_service_products_updated_at';

INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_alerts',
    'timestamp_triggers',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Trigger de timestamp ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END
FROM pg_trigger 
WHERE tgrelid = 'inventory_alerts'::regclass
AND tgname = 'update_inventory_alerts_updated_at';

INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_alert_config',
    'timestamp_triggers',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END,
    'Trigger de timestamp ' || CASE WHEN COUNT(*) > 0 THEN 'existe' ELSE 'NO existe' END
FROM pg_trigger 
WHERE tgrelid = 'product_alert_config'::regclass
AND tgname = 'update_product_alert_config_updated_at';

-- =================================================================
-- 7. Verificar Datos Iniciales
-- =================================================================

-- Verificar si hay datos en product_inventory
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_inventory',
    'data_check',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END,
    'Registros encontrados: ' || COUNT(*) || ' (0 es normal si no hay productos)'
FROM product_inventory;

-- Verificar si hay datos en service_products
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'service_products',
    'data_check',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END,
    'Registros encontrados: ' || COUNT(*) || ' (0 es normal si no hay servicios con productos)'
FROM service_products;

-- Verificar si hay datos en inventory_transactions
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_transactions',
    'data_check',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END,
    'Registros encontrados: ' || COUNT(*) || ' (0 es normal si no hay transacciones)'
FROM inventory_transactions;

-- Verificar si hay datos en inventory_alerts
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'inventory_alerts',
    'data_check',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END,
    'Registros encontrados: ' || COUNT(*) || ' (0 es normal si no hay alertas)'
FROM inventory_alerts;

-- Verificar si hay datos en product_alert_config
INSERT INTO verification_results (table_name, check_type, status, details)
SELECT 
    'product_alert_config',
    'data_check',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END,
    'Registros encontrados: ' || COUNT(*) || ' (0 es normal si no hay configuraciones)'
FROM product_alert_config;

-- =================================================================
-- 8. Mostrar Resultados
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
-- 9. Verificación Final
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
-- FIN DE LA VERIFICACIÓN
-- =================================================================