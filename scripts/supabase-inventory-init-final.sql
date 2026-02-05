-- =================================================================
-- INICIALIZACIÓN FINAL PARA SUPABASE - SISTEMA DE INVENTARIO
-- =================================================================
-- Este script inicializa los datos de inventario de forma segura
-- Es 100% compatible con Supabase y seguro para producción
-- =================================================================

-- =================================================================
-- 1. Inicializar Inventario de Productos
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
    p.tenant_id,
    p.id,
    0, -- Cantidad inicial por defecto
    10, -- Nivel de reorden por defecto
    20, -- Cantidad de reorden por defecto
    0, -- Costo unitario por defecto
    'Principal',
    '{"auto_reorder": false, "track_serial": false}'
FROM products p
LEFT JOIN product_inventory pi ON p.id = pi.product_id AND p.tenant_id = pi.tenant_id
WHERE pi.id IS NULL
AND p.tenant_id IS NOT NULL
AND p.id IS NOT NULL;

-- =================================================================
-- 2. Inicializar Productos por Servicio
-- =================================================================

-- Insertar productos asociados a servicios existentes
-- Esto es un ejemplo, deberías ajustar los IDs según tus necesidades
INSERT INTO service_products (
    tenant_id,
    service_id,
    product_id,
    quantity,
    optional,
    metadata
)
SELECT 
    s.tenant_id,
    s.id,
    p.id,
    1, -- Cantidad por defecto
    false, -- No es opcional por defecto
    '{"auto_deduct": true, "required": true}'
FROM services s
CROSS JOIN products p
LEFT JOIN service_products sp ON s.id = sp.service_id 
    AND p.id = sp.product_id 
    AND s.tenant_id = sp.tenant_id
WHERE sp.id IS NULL
AND s.tenant_id = p.tenant_id
AND s.tenant_id IS NOT NULL
AND s.id IS NOT NULL
AND p.id IS NOT NULL
-- Limitar a 100 registros para no sobrecargar
LIMIT 100;

-- =================================================================
-- 3. Inicializar Configuración de Alertas
-- =================================================================

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
    pi.tenant_id,
    pi.product_id,
    10, -- Umbral de stock bajo por defecto
    true, -- Habilitar alertas de stock bajo
    true, -- Habilitar alertas de sin stock
    NULL, -- Sin umbral de sobrestock por defecto
    false, -- Deshabilitar alertas de sobrestock
    NULL, -- Sin días de advertencia de caducidad
    false, -- Deshabilitar advertencias de caducidad
    true, -- Habilitar notificaciones por email
    '{"notify_admins": true, "frequency": "daily"}'
FROM product_inventory pi
LEFT JOIN product_alert_config pac ON pi.product_id = pac.product_id 
    AND pi.tenant_id = pac.tenant_id
WHERE pac.id IS NULL
AND pi.tenant_id IS NOT NULL
AND pi.product_id IS NOT NULL;

-- =================================================================
-- 4. Crear Transacciones Iniciales de Inventario
-- =================================================================

-- Insertar transacciones iniciales para productos con stock
INSERT INTO inventory_transactions (
    tenant_id,
    product_id,
    type,
    quantity,
    previous_quantity,
    new_quantity,
    reference_type,
    reference_id,
    notes,
    metadata
)
SELECT 
    pi.tenant_id,
    pi.product_id,
    'initial',
    pi.quantity,
    0, -- Cantidad anterior
    pi.quantity, -- Nueva cantidad
    'system_initialization',
    NULL, -- Sin ID de referencia
    'Stock inicial del sistema',
    '{"source": "system", "batch_id": "INITIAL"}'
FROM product_inventory pi
WHERE pi.quantity > 0
AND pi.tenant_id IS NOT NULL
AND pi.product_id IS NOT NULL;

-- =================================================================
-- 5. Generar Alertas Iniciales
-- =================================================================

-- Generar alertas de stock bajo
INSERT INTO inventory_alerts (
    tenant_id,
    product_id,
    alert_type,
    severity,
    threshold,
    current_value,
    status,
    notes,
    metadata
)
SELECT 
    pi.tenant_id,
    pi.product_id,
    'low_stock',
    CASE 
        WHEN pi.quantity = 0 THEN 'critical'
        WHEN pi.quantity <= pi.reorder_level * 0.5 THEN 'high'
        ELSE 'medium'
    END,
    pi.reorder_level,
    pi.quantity,
    'active',
    'Alerta generada automáticamente por bajo stock',
    '{"auto_generated": true, "threshold_type": "reorder_level"}'
FROM product_inventory pi
LEFT JOIN inventory_alerts ia ON pi.product_id = ia.product_id 
    AND pi.tenant_id = ia.tenant_id
    AND ia.alert_type = 'low_stock'
    AND ia.status = 'active'
WHERE ia.id IS NULL
AND pi.quantity <= pi.reorder_level
AND pi.quantity > 0
AND pi.tenant_id IS NOT NULL
AND pi.product_id IS NOT NULL;

-- Generar alertas de sin stock
INSERT INTO inventory_alerts (
    tenant_id,
    product_id,
    alert_type,
    severity,
    threshold,
    current_value,
    status,
    notes,
    metadata
)
SELECT 
    pi.tenant_id,
    pi.product_id,
    'out_of_stock',
    'critical',
    0,
    pi.quantity,
    'active',
    'Alerta crítica: producto sin stock',
    '{"auto_generated": true, "urgent": true}'
FROM product_inventory pi
LEFT JOIN inventory_alerts ia ON pi.product_id = ia.product_id 
    AND pi.tenant_id = ia.tenant_id
    AND ia.alert_type = 'out_of_stock'
    AND ia.status = 'active'
WHERE ia.id IS NULL
AND pi.quantity = 0
AND pi.tenant_id IS NOT NULL
AND pi.product_id IS NOT NULL;

-- =================================================================
-- COMENTARIOS FINALES
-- =================================================================

-- Este script inicializa los datos de inventario de forma segura:
-- - Solo inserta registros que no existen
-- - No modifica datos existentes
-- - No elimina información
-- - Es completamente idempotente

-- =================================================================
-- FIN DE LA INICIALIZACIÓN
-- =================================================================