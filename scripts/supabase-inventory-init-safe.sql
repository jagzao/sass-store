-- =================================================================
-- INICIALIZACIÓN SEGURA DE DATOS DE INVENTARIO PARA SUPABASE
-- =================================================================
-- Este script es seguro para ejecutar en producción porque:
-- 1. Solo inserta datos si no existen ya
-- 2. No modifica ni elimina datos existentes
-- 3. Usa INSERT con SELECT para evitar duplicados
-- 4. Incluye verificaciones de seguridad
-- =================================================================

DO $$
DECLARE
    v_tenant_count INTEGER;
    v_product_count INTEGER;
    v_inventory_count INTEGER;
    v_created_count INTEGER := 0;
BEGIN
    -- =================================================================
    -- VERIFICACIÓN PREVIA
    -- =================================================================
    
    -- Contar tenants existentes
    SELECT COUNT(*) INTO v_tenant_count FROM tenants;
    RAISE NOTICE 'Tenants existentes: %', v_tenant_count;
    
    -- Contar productos existentes
    SELECT COUNT(*) INTO v_product_count FROM products;
    RAISE NOTICE 'Productos existentes: %', v_product_count;
    
    -- Contar registros de inventario existentes
    SELECT COUNT(*) INTO v_inventory_count FROM product_inventory;
    RAISE NOTICE 'Registros de inventario existentes: %', v_inventory_count;
    
    -- =================================================================
    -- INSERCIÓN SEGURA DE DATOS DE INVENTARIO
    -- =================================================================
    
    -- Solo continuar si hay tenants y productos
    IF v_tenant_count > 0 AND v_product_count > 0 THEN
        
        -- Insertar registros de inventario para productos que no tienen uno
        -- Esto es seguro porque usa LEFT JOIN y WHERE IS NULL
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
        
        GET DIAGNOSTICS v_created_count = ROW_COUNT;
        RAISE NOTICE 'Registros de inventario creados: %', v_created_count;
        
        -- =================================================================
        -- INSERCIÓN SEGURA DE CONFIGURACIÓN DE ALERTAS
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
        
        GET DIAGNOSTICS v_created_count = ROW_COUNT;
        RAISE NOTICE 'Configuraciones de alertas creadas: %', v_created_count;
        
    ELSE
        RAISE NOTICE 'No se pueden crear registros de inventario: no hay tenants o productos.';
    END IF;
    
    -- =================================================================
    -- VERIFICACIÓN FINAL
    -- =================================================================
    
    -- Contar registros después de la inserción
    SELECT COUNT(*) INTO v_inventory_count FROM product_inventory;
    RAISE NOTICE 'Total de registros de inventario después de la migración: %', v_inventory_count;
    
    -- Contar configuraciones de alertas
    SELECT COUNT(*) INTO v_inventory_count FROM product_alert_config;
    RAISE NOTICE 'Total de configuraciones de alertas después de la migración: %', v_inventory_count;
    
    -- =================================================================
    -- MENSAJE FINAL
    -- =================================================================
    
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'INICIALIZACIÓN DE INVENTARIO COMPLETADA SEGURAMENTE';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Este script es seguro para producción porque:';
    RAISE NOTICE '1. Solo inserta datos si no existen ya';
    RAISE NOTICE '2. No modifica ni elimina datos existentes';
    RAISE NOTICE '3. Usa INSERT con SELECT para evitar duplicados';
    RAISE NOTICE '4. Incluye verificaciones de seguridad';
    RAISE NOTICE '====================================================================';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error durante la inicialización de inventario: %', SQLERRM;
END $$;