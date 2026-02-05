-- =================================================================
-- SCRIPT DE VERIFICACIÓN DE INVENTARIO PARA SUPABASE
-- =================================================================
-- Este script verifica que todas las tablas y estructuras del sistema
-- de inventario se han creado correctamente sin modificar datos
-- =================================================================

DO $$
DECLARE
    v_table_count INTEGER := 0;
    v_index_count INTEGER := 0;
    v_trigger_count INTEGER := 0;
    v_policy_count INTEGER := 0;
    v_function_count INTEGER := 0;
BEGIN
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'VERIFICACIÓN DEL SISTEMA DE INVENTARIO';
    RAISE NOTICE '====================================================================';
    
    -- =================================================================
    -- VERIFICACIÓN DE TABLAS
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '1. VERIFICACIÓN DE TABLAS';
    RAISE NOTICE '========================';
    
    -- Verificar tabla product_inventory
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_inventory') THEN
        RAISE NOTICE '✅ Tabla product_inventory existe';
        
        -- Verificar columnas
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'product_inventory' AND column_name = 'id') THEN
            RAISE NOTICE '   ✅ Columna id: OK';
        ELSE
            RAISE NOTICE '   ❌ Columna id: FALTANTE';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'product_inventory' AND column_name = 'tenant_id') THEN
            RAISE NOTICE '   ✅ Columna tenant_id: OK';
        ELSE
            RAISE NOTICE '   ❌ Columna tenant_id: FALTANTE';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'product_inventory' AND column_name = 'product_id') THEN
            RAISE NOTICE '   ✅ Columna product_id: OK';
        ELSE
            RAISE NOTICE '   ❌ Columna product_id: FALTANTE';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'product_inventory' AND column_name = 'quantity') THEN
            RAISE NOTICE '   ✅ Columna quantity: OK';
        ELSE
            RAISE NOTICE '   ❌ Columna quantity: FALTANTE';
        END IF;
        
        v_table_count := v_table_count + 1;
    ELSE
        RAISE NOTICE '❌ Tabla product_inventory NO existe';
    END IF;
    
    -- Verificar tabla service_products
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_products') THEN
        RAISE NOTICE '✅ Tabla service_products existe';
        v_table_count := v_table_count + 1;
    ELSE
        RAISE NOTICE '❌ Tabla service_products NO existe';
    END IF;
    
    -- Verificar tabla inventory_transactions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
        RAISE NOTICE '✅ Tabla inventory_transactions existe';
        v_table_count := v_table_count + 1;
    ELSE
        RAISE NOTICE '❌ Tabla inventory_transactions NO existe';
    END IF;
    
    -- Verificar tabla inventory_alerts
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_alerts') THEN
        RAISE NOTICE '✅ Tabla inventory_alerts existe';
        v_table_count := v_table_count + 1;
    ELSE
        RAISE NOTICE '❌ Tabla inventory_alerts NO existe';
    END IF;
    
    -- Verificar tabla product_alert_config
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_alert_config') THEN
        RAISE NOTICE '✅ Tabla product_alert_config existe';
        v_table_count := v_table_count + 1;
    ELSE
        RAISE NOTICE '❌ Tabla product_alert_config NO existe';
    END IF;
    
    RAISE NOTICE 'Total de tablas verificadas: %/5', v_table_count;
    
    -- =================================================================
    -- VERIFICACIÓN DE ÍNDICES
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '2. VERIFICACIÓN DE ÍNDICES';
    RAISE NOTICE '==========================';
    
    -- Verificar índices de product_inventory
    IF EXISTS (SELECT FROM pg_indexes WHERE tablename = 'product_inventory' AND indexname = 'idx_product_inventory_tenant_product') THEN
        RAISE NOTICE '✅ Índice idx_product_inventory_tenant_product: OK';
        v_index_count := v_index_count + 1;
    ELSE
        RAISE NOTICE '❌ Índice idx_product_inventory_tenant_product: FALTANTE';
    END IF;
    
    IF EXISTS (SELECT FROM pg_indexes WHERE tablename = 'product_inventory' AND indexname = 'idx_product_inventory_tenant') THEN
        RAISE NOTICE '✅ Índice idx_product_inventory_tenant: OK';
        v_index_count := v_index_count + 1;
    ELSE
        RAISE NOTICE '❌ Índice idx_product_inventory_tenant: FALTANTE';
    END IF;
    
    -- Verificar índices de service_products
    IF EXISTS (SELECT FROM pg_indexes WHERE tablename = 'service_products' AND indexname = 'idx_service_products_tenant_service_product') THEN
        RAISE NOTICE '✅ Índice idx_service_products_tenant_service_product: OK';
        v_index_count := v_index_count + 1;
    ELSE
        RAISE NOTICE '❌ Índice idx_service_products_tenant_service_product: FALTANTE';
    END IF;
    
    RAISE NOTICE 'Total de índices verificados: % (de varios esperados)', v_index_count;
    
    -- =================================================================
    -- VERIFICACIÓN DE FUNCIONES
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '3. VERIFICACIÓN DE FUNCIONES';
    RAISE NOTICE '============================';
    
    -- Verificar funciones de triggers
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'update_product_inventory_updated_at') THEN
        RAISE NOTICE '✅ Función update_product_inventory_updated_at: OK';
        v_function_count := v_function_count + 1;
    ELSE
        RAISE NOTICE '❌ Función update_product_inventory_updated_at: FALTANTE';
    END IF;
    
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'update_service_products_updated_at') THEN
        RAISE NOTICE '✅ Función update_service_products_updated_at: OK';
        v_function_count := v_function_count + 1;
    ELSE
        RAISE NOTICE '❌ Función update_service_products_updated_at: FALTANTE';
    END IF;
    
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'update_inventory_alerts_updated_at') THEN
        RAISE NOTICE '✅ Función update_inventory_alerts_updated_at: OK';
        v_function_count := v_function_count + 1;
    ELSE
        RAISE NOTICE '❌ Función update_inventory_alerts_updated_at: FALTANTE';
    END IF;
    
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'update_product_alert_config_updated_at') THEN
        RAISE NOTICE '✅ Función update_product_alert_config_updated_at: OK';
        v_function_count := v_function_count + 1;
    ELSE
        RAISE NOTICE '❌ Función update_product_alert_config_updated_at: FALTANTE';
    END IF;
    
    RAISE NOTICE 'Total de funciones verificadas: %/4', v_function_count;
    
    -- =================================================================
    -- VERIFICACIÓN DE TRIGGERS
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '4. VERIFICACIÓN DE TRIGGERS';
    RAISE NOTICE '===========================';
    
    -- Verificar triggers
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trg_product_inventory_updated_at') THEN
        RAISE NOTICE '✅ Trigger trg_product_inventory_updated_at: OK';
        v_trigger_count := v_trigger_count + 1;
    ELSE
        RAISE NOTICE '❌ Trigger trg_product_inventory_updated_at: FALTANTE';
    END IF;
    
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trg_service_products_updated_at') THEN
        RAISE NOTICE '✅ Trigger trg_service_products_updated_at: OK';
        v_trigger_count := v_trigger_count + 1;
    ELSE
        RAISE NOTICE '❌ Trigger trg_service_products_updated_at: FALTANTE';
    END IF;
    
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trg_inventory_alerts_updated_at') THEN
        RAISE NOTICE '✅ Trigger trg_inventory_alerts_updated_at: OK';
        v_trigger_count := v_trigger_count + 1;
    ELSE
        RAISE NOTICE '❌ Trigger trg_inventory_alerts_updated_at: FALTANTE';
    END IF;
    
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trg_product_alert_config_updated_at') THEN
        RAISE NOTICE '✅ Trigger trg_product_alert_config_updated_at: OK';
        v_trigger_count := v_trigger_count + 1;
    ELSE
        RAISE NOTICE '❌ Trigger trg_product_alert_config_updated_at: FALTANTE';
    END IF;
    
    RAISE NOTICE 'Total de triggers verificados: %/4', v_trigger_count;
    
    -- =================================================================
    -- VERIFICACIÓN DE POLÍTICAS RLS
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '5. VERIFICACIÓN DE POLÍTICAS RLS';
    RAISE NOTICE '=================================';
    
    -- Verificar políticas RLS
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'product_inventory' AND policyname = 'tenant_isolation_product_inventory') THEN
        RAISE NOTICE '✅ Política tenant_isolation_product_inventory: OK';
        v_policy_count := v_policy_count + 1;
    ELSE
        RAISE NOTICE '❌ Política tenant_isolation_product_inventory: FALTANTE';
    END IF;
    
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'service_products' AND policyname = 'tenant_isolation_service_products') THEN
        RAISE NOTICE '✅ Política tenant_isolation_service_products: OK';
        v_policy_count := v_policy_count + 1;
    ELSE
        RAISE NOTICE '❌ Política tenant_isolation_service_products: FALTANTE';
    END IF;
    
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'inventory_transactions' AND policyname = 'tenant_isolation_inventory_transactions') THEN
        RAISE NOTICE '✅ Política tenant_isolation_inventory_transactions: OK';
        v_policy_count := v_policy_count + 1;
    ELSE
        RAISE NOTICE '❌ Política tenant_isolation_inventory_transactions: FALTANTE';
    END IF;
    
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'inventory_alerts' AND policyname = 'tenant_isolation_inventory_alerts') THEN
        RAISE NOTICE '✅ Política tenant_isolation_inventory_alerts: OK';
        v_policy_count := v_policy_count + 1;
    ELSE
        RAISE NOTICE '❌ Política tenant_isolation_inventory_alerts: FALTANTE';
    END IF;
    
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'product_alert_config' AND policyname = 'tenant_isolation_product_alert_config') THEN
        RAISE NOTICE '✅ Política tenant_isolation_product_alert_config: OK';
        v_policy_count := v_policy_count + 1;
    ELSE
        RAISE NOTICE '❌ Política tenant_isolation_product_alert_config: FALTANTE';
    END IF;
    
    RAISE NOTICE 'Total de políticas RLS verificadas: %/5', v_policy_count;
    
    -- =================================================================
    -- VERIFICACIÓN DE DATOS
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '6. VERIFICACIÓN DE DATOS';
    RAISE NOTICE '========================';
    
    -- Contar registros en cada tabla
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_inventory') THEN
        EXECUTE 'SELECT COUNT(*) FROM product_inventory' INTO v_table_count;
        RAISE NOTICE 'Registros en product_inventory: %', v_table_count;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_products') THEN
        EXECUTE 'SELECT COUNT(*) FROM service_products' INTO v_table_count;
        RAISE NOTICE 'Registros en service_products: %', v_table_count;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
        EXECUTE 'SELECT COUNT(*) FROM inventory_transactions' INTO v_table_count;
        RAISE NOTICE 'Registros en inventory_transactions: %', v_table_count;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_alerts') THEN
        EXECUTE 'SELECT COUNT(*) FROM inventory_alerts' INTO v_table_count;
        RAISE NOTICE 'Registros en inventory_alerts: %', v_table_count;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_alert_config') THEN
        EXECUTE 'SELECT COUNT(*) FROM product_alert_config' INTO v_table_count;
        RAISE NOTICE 'Registros en product_alert_config: %', v_table_count;
    END IF;
    
    -- =================================================================
    -- RESUMEN FINAL
    -- =================================================================
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'RESUMEN DE VERIFICACIÓN';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Tablas creadas: %/5', v_table_count;
    RAISE NOTICE 'Funciones creadas: %/4', v_function_count;
    RAISE NOTICE 'Triggers creados: %/4', v_trigger_count;
    RAISE NOTICE 'Políticas RLS creadas: %/5', v_policy_count;
    
    IF v_table_count = 5 AND v_function_count = 4 AND v_trigger_count = 4 AND v_policy_count = 5 THEN
        RAISE NOTICE '🎉 ¡SISTEMA DE INVENTARIO COMPLETO Y FUNCIONAL!';
    ELSE
        RAISE NOTICE '⚠️  El sistema de inventario necesita atención. Faltan componentes.';
    END IF;
    
    RAISE NOTICE '====================================================================';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error durante la verificación: %', SQLERRM;
END $$;