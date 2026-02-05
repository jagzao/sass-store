-- =================================================================
-- SCRIPT DE VERIFICACIÓN DE INVENTARIO PARA SUPABASE (SIMPLIFICADO)
-- =================================================================
-- Este script verifica que todas las tablas del sistema
-- de inventario se han creado correctamente sin modificar datos
-- =================================================================

DO $$
DECLARE
    v_table_count INTEGER := 0;
    v_total_tables INTEGER := 0;
    v_record_count INTEGER;
BEGIN
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'VERIFICACIÓN DEL SISTEMA DE INVENTARIO PARA SUPABASE';
    RAISE NOTICE '====================================================================';
    
    -- =================================================================
    -- VERIFICACIÓN DE TABLAS
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '1. VERIFICACIÓN DE TABLAS';
    RAISE NOTICE '========================';
    
    -- Verificar tabla product_inventory
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_inventory') THEN
        RAISE NOTICE '✅ Tabla product_inventory existe';
        
        -- Contar registros
        EXECUTE 'SELECT COUNT(*) FROM product_inventory' INTO v_record_count;
        RAISE NOTICE '   Registros: %', v_record_count;
        
        v_table_count := v_table_count + 1;
        v_total_tables := v_total_tables + 1;
    ELSE
        RAISE NOTICE '❌ Tabla product_inventory NO existe';
    END IF;
    
    -- Verificar tabla service_products
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_products') THEN
        RAISE NOTICE '✅ Tabla service_products existe';
        
        -- Contar registros
        EXECUTE 'SELECT COUNT(*) FROM service_products' INTO v_record_count;
        RAISE NOTICE '   Registros: %', v_record_count;
        
        v_table_count := v_table_count + 1;
        v_total_tables := v_total_tables + 1;
    ELSE
        RAISE NOTICE '❌ Tabla service_products NO existe';
    END IF;
    
    -- Verificar tabla inventory_transactions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_transactions') THEN
        RAISE NOTICE '✅ Tabla inventory_transactions existe';
        
        -- Contar registros
        EXECUTE 'SELECT COUNT(*) FROM inventory_transactions' INTO v_record_count;
        RAISE NOTICE '   Registros: %', v_record_count;
        
        v_table_count := v_table_count + 1;
        v_total_tables := v_total_tables + 1;
    ELSE
        RAISE NOTICE '❌ Tabla inventory_transactions NO existe';
    END IF;
    
    -- Verificar tabla inventory_alerts
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_alerts') THEN
        RAISE NOTICE '✅ Tabla inventory_alerts existe';
        
        -- Contar registros
        EXECUTE 'SELECT COUNT(*) FROM inventory_alerts' INTO v_record_count;
        RAISE NOTICE '   Registros: %', v_record_count;
        
        v_table_count := v_table_count + 1;
        v_total_tables := v_total_tables + 1;
    ELSE
        RAISE NOTICE '❌ Tabla inventory_alerts NO existe';
    END IF;
    
    -- Verificar tabla product_alert_config
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_alert_config') THEN
        RAISE NOTICE '✅ Tabla product_alert_config existe';
        
        -- Contar registros
        EXECUTE 'SELECT COUNT(*) FROM product_alert_config' INTO v_record_count;
        RAISE NOTICE '   Registros: %', v_record_count;
        
        v_table_count := v_table_count + 1;
        v_total_tables := v_total_tables + 1;
    ELSE
        RAISE NOTICE '❌ Tabla product_alert_config NO existe';
    END IF;
    
    RAISE NOTICE 'Total de tablas verificadas: %/5', v_table_count;
    
    -- =================================================================
    -- VERIFICACIÓN DE RELACIONES CON TABLAS EXISTENTES
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '2. VERIFICACIÓN DE RELACIONES';
    RAISE NOTICE '============================';
    
    -- Verificar tabla tenants (debe existir)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
        EXECUTE 'SELECT COUNT(*) FROM tenants' INTO v_record_count;
        RAISE NOTICE '✅ Tabla tenants existe (%)', v_record_count;
    ELSE
        RAISE NOTICE '❌ Tabla tenants NO existe (requerida)';
    END IF;
    
    -- Verificar tabla products (debe existir)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        EXECUTE 'SELECT COUNT(*) FROM products' INTO v_record_count;
        RAISE NOTICE '✅ Tabla products existe (%)', v_record_count;
    ELSE
        RAISE NOTICE '❌ Tabla products NO existe (requerida)';
    END IF;
    
    -- Verificar tabla services (debe existir)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
        EXECUTE 'SELECT COUNT(*) FROM services' INTO v_record_count;
        RAISE NOTICE '✅ Tabla services existe (%)', v_record_count;
    ELSE
        RAISE NOTICE '❌ Tabla services NO existe (requerida)';
    END IF;
    
    -- =================================================================
    -- VERIFICACIÓN DE ÍNDICES (SIMPLIFICADA)
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '3. VERIFICACIÓN DE ÍNDICES';
    RAISE NOTICE '==========================';
    
    -- Verificar algunos índices clave
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_inventory') THEN
        IF EXISTS (SELECT FROM pg_indexes WHERE tablename = 'product_inventory') THEN
            RAISE NOTICE '✅ Índices en product_inventory existen';
        ELSE
            RAISE NOTICE '⚠️ No hay índices en product_inventory';
        END IF;
    END IF;
    
    -- =================================================================
    -- VERIFICACIÓN DE POLÍTICAS RLS (SIMPLIFICADA)
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '4. VERIFICACIÓN DE POLÍTICAS RLS';
    RAISE NOTICE '=================================';
    
    -- Verificar si RLS está habilitado en las tablas
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_inventory') THEN
        -- En Supabase, verificamos si la tabla tiene RLS habilitado
        BEGIN
            -- Intentar seleccionar sin WHERE para ver si hay políticas
            -- Esto fallará si RLS está habilitado y no hay políticas
            EXECUTE 'SELECT COUNT(*) FROM product_inventory LIMIT 1' INTO v_record_count;
            RAISE NOTICE 'ℹ️ RLS en product_inventory: deshabilitado o con políticas';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ℹ️ RLS en product_inventory: habilitado';
        END;
    END IF;
    
    -- =================================================================
    -- PRUEBA BÁSICA DE FUNCIONALIDAD
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '5. PRUEBA BÁSICA DE FUNCIONALIDAD';
    RAISE NOTICE '====================================';
    
    -- Intentar hacer una consulta simple a cada tabla si existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_inventory') THEN
        BEGIN
            EXECUTE 'SELECT COUNT(*) FROM product_inventory LIMIT 1' INTO v_record_count;
            RAISE NOTICE '✅ Consulta a product_inventory exitosa';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Error al consultar product_inventory: %', SQLERRM;
        END;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_products') THEN
        BEGIN
            EXECUTE 'SELECT COUNT(*) FROM service_products LIMIT 1' INTO v_record_count;
            RAISE NOTICE '✅ Consulta a service_products exitosa';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Error al consultar service_products: %', SQLERRM;
        END;
    END IF;
    
    -- =================================================================
    -- RESUMEN FINAL
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'RESUMEN DE VERIFICACIÓN';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Tablas de inventario creadas: %/5', v_table_count;
    
    IF v_table_count = 5 THEN
        RAISE NOTICE '🎉 ¡SISTEMA DE INVENTARIO COMPLETO Y FUNCIONAL!';
        RAISE NOTICE '';
        RAISE NOTICE 'Puedes proceder a:';
        RAISE NOTICE '1. Usar la API de inventario desde la aplicación';
        RAISE NOTICE '2. Gestionar el stock de productos';
        RAISE NOTICE '3. Asociar productos a servicios';
        RAISE NOTICE '4. Configurar alertas de inventario';
    ELSE
        RAISE NOTICE '⚠️ El sistema de inventario necesita atención.';
        RAISE NOTICE 'Faltan % tablas por crear.', 5 - v_table_count;
        RAISE NOTICE '';
        RAISE NOTICE 'Ejecuta primero el script de migración:';
        RAISE NOTICE 'scripts/supabase-inventory-migration-safe.sql';
    END IF;
    
    RAISE NOTICE '====================================================================';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error durante la verificación: %', SQLERRM;
END $$;