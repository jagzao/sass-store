-- =================================================================
-- INICIALIZACIÓN DIRECTA DE DATOS DE INVENTARIO PARA SUPABASE
-- =================================================================
-- Este script inserta datos iniciales de inventario de forma segura
-- Solo inserta para productos que no tienen registro de inventario
-- =================================================================

-- Insertar registros de inventario para productos que no tienen uno
INSERT INTO product_inventory (
    tenant_id, 
    product_id, 
    quantity, 
    reorder_level, 
    reorder_quantity, 
    unit_cost, 
    location, 
    metadata
)
SELECT 
    t.id as tenant_id,
    p.id as product_id,
    0 as quantity, -- Inicializar con stock 0
    5 as reorder_level, -- Valor predeterminado
    10 as reorder_quantity, -- Valor predeterminado
    COALESCE(p.price, 0) as unit_cost, -- Usar el precio del producto como costo inicial
    'Principal' as location, -- Ubicación predeterminada
    jsonb_build_object(
        'source', 'initial_migration',
        'created_at', NOW(),
        'product_name', p.name,
        'product_sku', p.sku
    ) as metadata
FROM tenants t
CROSS JOIN products p
LEFT JOIN product_inventory pi ON p.id = pi.product_id AND t.id = pi.tenant_id
WHERE pi.id IS NULL -- Solo insertar si no existe registro de inventario
AND p.tenant_id = t.id; -- Asegurar que el producto pertenece al tenant

-- Insertar configuración de alertas para productos que no tienen una
INSERT INTO product_alert_config (
    tenant_id, 
    product_id, 
    low_stock_threshold, 
    low_stock_enabled, 
    out_of_stock_enabled, 
    overstock_threshold, 
    overstock_enabled, 
    expiry_warning_days, 
    expiry_warning_enabled, 
    email_notifications, 
    metadata
)
SELECT 
    t.id as tenant_id,
    p.id as product_id,
    10 as low_stock_threshold, -- Alertar cuando queden 10 unidades
    true as low_stock_enabled,
    true as out_of_stock_enabled,
    100 as overstock_threshold, -- Alertar cuando haya más de 100 unidades
    false as overstock_enabled,
    30 as expiry_warning_days, -- Alertar 30 días antes del vencimiento
    false as expiry_warning_enabled,
    true as email_notifications,
    jsonb_build_object(
        'source', 'initial_migration',
        'created_at', NOW(),
        'product_name', p.name,
        'product_sku', p.sku
    ) as metadata
FROM tenants t
CROSS JOIN products p
LEFT JOIN product_alert_config pac ON p.id = pac.product_id AND t.id = pac.tenant_id
WHERE pac.id IS NULL -- Solo insertar si no existe configuración
AND p.tenant_id = t.id; -- Asegurar que el producto pertenece al tenant

-- =================================================================
-- FIN DE LA INICIALIZACIÓN
-- =================================================================