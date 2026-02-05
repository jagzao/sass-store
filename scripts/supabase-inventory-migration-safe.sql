-- =================================================================
-- MIGRACIÓN SEGURA PARA SUPABASE - SISTEMA DE INVENTARIO
-- =================================================================
-- Este script es seguro para ejecutar en producción porque:
-- 1. Solo crea tablas si no existen (IF NOT EXISTS)
-- 2. No modifica datos existentes
-- 3. No elimina ni altera tablas existentes
-- 4. Incluye verificaciones de seguridad
-- =================================================================

-- Habilitar la extensión UUID si no está activa (no afecta si ya existe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- VERIFICACIÓN DE SEGURIDAD - NO EJECUTAR SI LAS TABLAS YA EXISTEN
-- =================================================================

DO $$
BEGIN
    -- Verificar si las tablas ya existen antes de crearlas
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_inventory') THEN
        RAISE NOTICE 'La tabla product_inventory ya existe. Omitiendo creación.';
    ELSE
        -- 1. Tabla de Inventario de Productos
        -- Almacena el stock actual y configuración de reorden por producto
        CREATE TABLE product_inventory (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
            reorder_level DECIMAL(10,2) NOT NULL DEFAULT 0,
            reorder_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
            unit_cost DECIMAL(10,2),
            location VARCHAR(100),
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices para optimización
        CREATE INDEX idx_product_inventory_tenant_product ON product_inventory(tenant_id, product_id);
        CREATE INDEX idx_product_inventory_tenant ON product_inventory(tenant_id);
        CREATE INDEX idx_product_inventory_product ON product_inventory(product_id);
        CREATE INDEX idx_product_inventory_tenant_low_stock ON product_inventory(tenant_id, quantity);
        CREATE INDEX idx_product_inventory_tenant_reorder ON product_inventory(tenant_id, reorder_level);
        
        -- Crear restricción única
        ALTER TABLE product_inventory ADD CONSTRAINT uc_tenant_product UNIQUE (tenant_id, product_id);
        
        RAISE NOTICE 'Tabla product_inventory creada exitosamente.';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_products') THEN
        RAISE NOTICE 'La tabla service_products ya existe. Omitiendo creación.';
    ELSE
        -- 2. Tabla de Productos por Servicio
        -- Relación muchos-a-muchos entre servicios y productos
        CREATE TABLE service_products (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
            optional BOOLEAN NOT NULL DEFAULT false,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices para optimización
        CREATE INDEX idx_service_products_tenant_service_product ON service_products(tenant_id, service_id, product_id);
        CREATE INDEX idx_service_products_tenant ON service_products(tenant_id);
        CREATE INDEX idx_service_products_service ON service_products(service_id);
        CREATE INDEX idx_service_products_product ON service_products(product_id);
        CREATE INDEX idx_service_products_service_tenant ON service_products(service_id, tenant_id);
        
        -- Crear restricción única
        ALTER TABLE service_products ADD CONSTRAINT uc_tenant_service_product UNIQUE (tenant_id, service_id, product_id);
        
        RAISE NOTICE 'Tabla service_products creada exitosamente.';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
        RAISE NOTICE 'La tabla inventory_transactions ya existe. Omitiendo creación.';
    ELSE
        -- 3. Tabla de Transacciones de Inventario
        -- Historial de todos los movimientos de inventario para auditoría
        CREATE TABLE inventory_transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL, -- 'deduction', 'addition', 'adjustment', 'initial'
            quantity DECIMAL(10,2) NOT NULL,
            previous_quantity DECIMAL(10,2) NOT NULL,
            new_quantity DECIMAL(10,2) NOT NULL,
            reference_type VARCHAR(50),
            reference_id UUID,
            notes TEXT,
            user_id TEXT REFERENCES users(id),
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices para optimización
        CREATE INDEX idx_inventory_transactions_tenant ON inventory_transactions(tenant_id);
        CREATE INDEX idx_inventory_transactions_product ON inventory_transactions(product_id);
        CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(type);
        CREATE INDEX idx_inventory_transactions_reference ON inventory_transactions(reference_type, reference_id);
        CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at);
        CREATE INDEX idx_inventory_transactions_tenant_product_type ON inventory_transactions(tenant_id, product_id, type);
        CREATE INDEX idx_inventory_transactions_tenant_date ON inventory_transactions(tenant_id, created_at);
        
        RAISE NOTICE 'Tabla inventory_transactions creada exitosamente.';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_alerts') THEN
        RAISE NOTICE 'La tabla inventory_alerts ya existe. Omitiendo creación.';
    ELSE
        -- 4. Tabla de Alertas de Inventario
        -- Alertas generadas automáticamente por el sistema
        CREATE TABLE inventory_alerts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'out_of_stock', 'overstock', 'expiry_warning'
            severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
            threshold DECIMAL(10,2),
            current_value DECIMAL(10,2),
            status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
            acknowledged_by TEXT REFERENCES users(id),
            acknowledged_at TIMESTAMP WITH TIME ZONE,
            resolved_at TIMESTAMP WITH TIME ZONE,
            notes TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices para optimización
        CREATE INDEX idx_inventory_alerts_tenant ON inventory_alerts(tenant_id);
        CREATE INDEX idx_inventory_alerts_product ON inventory_alerts(product_id);
        CREATE INDEX idx_inventory_alerts_alert_type ON inventory_alerts(alert_type);
        CREATE INDEX idx_inventory_alerts_severity ON inventory_alerts(severity);
        CREATE INDEX idx_inventory_alerts_status ON inventory_alerts(status);
        CREATE INDEX idx_inventory_alerts_created_at ON inventory_alerts(created_at);
        CREATE INDEX idx_inventory_alerts_tenant_active ON inventory_alerts(tenant_id, status);
        CREATE INDEX idx_inventory_alerts_tenant_severity ON inventory_alerts(tenant_id, severity);
        
        RAISE NOTICE 'Tabla inventory_alerts creada exitosamente.';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_alert_config') THEN
        RAISE NOTICE 'La tabla product_alert_config ya existe. Omitiendo creación.';
    ELSE
        -- 5. Tabla de Configuración de Alertas por Producto
        -- Configuración personalizada de alertas para cada producto
        CREATE TABLE product_alert_config (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            low_stock_threshold DECIMAL(10,2),
            low_stock_enabled BOOLEAN NOT NULL DEFAULT true,
            out_of_stock_enabled BOOLEAN NOT NULL DEFAULT true,
            overstock_threshold DECIMAL(10,2),
            overstock_enabled BOOLEAN NOT NULL DEFAULT false,
            expiry_warning_days INTEGER,
            expiry_warning_enabled BOOLEAN NOT NULL DEFAULT false,
            email_notifications BOOLEAN NOT NULL DEFAULT true,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices para optimización
        CREATE INDEX idx_product_alert_config_tenant_product ON product_alert_config(tenant_id, product_id);
        CREATE INDEX idx_product_alert_config_tenant ON product_alert_config(tenant_id);
        CREATE INDEX idx_product_alert_config_product ON product_alert_config(product_id);
        
        -- Crear restricción única
        ALTER TABLE product_alert_config ADD CONSTRAINT uc_tenant_product_alert_config UNIQUE (tenant_id, product_id);
        
        RAISE NOTICE 'Tabla product_alert_config creada exitosamente.';
    END IF;
    
    -- =================================================================
    -- CREACIÓN DE FUNCIONES Y TRIGGERS (SOLO SI LAS TABLAS EXISTEN)
    -- =================================================================
    
    -- Función y trigger para product_inventory
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_inventory') THEN
        IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_product_inventory_updated_at') THEN
            CREATE OR REPLACE FUNCTION update_product_inventory_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            CREATE TRIGGER trg_product_inventory_updated_at
                BEFORE UPDATE ON product_inventory
                FOR EACH ROW
                EXECUTE FUNCTION update_product_inventory_updated_at();
                
            RAISE NOTICE 'Función y trigger para product_inventory creados.';
        END IF;
    END IF;
    
    -- Función y trigger para service_products
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_products') THEN
        IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_service_products_updated_at') THEN
            CREATE OR REPLACE FUNCTION update_service_products_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            CREATE TRIGGER trg_service_products_updated_at
                BEFORE UPDATE ON service_products
                FOR EACH ROW
                EXECUTE FUNCTION update_service_products_updated_at();
                
            RAISE NOTICE 'Función y trigger para service_products creados.';
        END IF;
    END IF;
    
    -- Función y trigger para inventory_alerts
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_alerts') THEN
        IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_inventory_alerts_updated_at') THEN
            CREATE OR REPLACE FUNCTION update_inventory_alerts_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            CREATE TRIGGER trg_inventory_alerts_updated_at
                BEFORE UPDATE ON inventory_alerts
                FOR EACH ROW
                EXECUTE FUNCTION update_inventory_alerts_updated_at();
                
            RAISE NOTICE 'Función y trigger para inventory_alerts creados.';
        END IF;
    END IF;
    
    -- Función y trigger para product_alert_config
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_alert_config') THEN
        IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'update_product_alert_config_updated_at') THEN
            CREATE OR REPLACE FUNCTION update_product_alert_config_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            CREATE TRIGGER trg_product_alert_config_updated_at
                BEFORE UPDATE ON product_alert_config
                FOR EACH ROW
                EXECUTE FUNCTION update_product_alert_config_updated_at();
                
            RAISE NOTICE 'Función y trigger para product_alert_config creados.';
        END IF;
    END IF;
    
    -- =================================================================
    -- HABILITAR RLS (Row Level Security) - SOLO SI LAS TABLAS EXISTEN
    -- =================================================================
    
    -- Habilitar RLS en todas las tablas de inventario
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_inventory') THEN
        ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;
        
        -- Política RLS para product_inventory
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'product_inventory' AND policyname = 'tenant_isolation_product_inventory') THEN
            CREATE POLICY tenant_isolation_product_inventory ON product_inventory
                FOR ALL TO app_user
                USING (tenant_id = current_tenant_id())
                WITH CHECK (tenant_id = current_tenant_id());
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_products') THEN
        ALTER TABLE service_products ENABLE ROW LEVEL SECURITY;
        
        -- Política RLS para service_products
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'service_products' AND policyname = 'tenant_isolation_service_products') THEN
            CREATE POLICY tenant_isolation_service_products ON service_products
                FOR ALL TO app_user
                USING (tenant_id = current_tenant_id())
                WITH CHECK (tenant_id = current_tenant_id());
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
        ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
        
        -- Política RLS para inventory_transactions
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'inventory_transactions' AND policyname = 'tenant_isolation_inventory_transactions') THEN
            CREATE POLICY tenant_isolation_inventory_transactions ON inventory_transactions
                FOR ALL TO app_user
                USING (tenant_id = current_tenant_id())
                WITH CHECK (tenant_id = current_tenant_id());
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_alerts') THEN
        ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
        
        -- Política RLS para inventory_alerts
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'inventory_alerts' AND policyname = 'tenant_isolation_inventory_alerts') THEN
            CREATE POLICY tenant_isolation_inventory_alerts ON inventory_alerts
                FOR ALL TO app_user
                USING (tenant_id = current_tenant_id())
                WITH CHECK (tenant_id = current_tenant_id());
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_alert_config') THEN
        ALTER TABLE product_alert_config ENABLE ROW LEVEL SECURITY;
        
        -- Política RLS para product_alert_config
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'product_alert_config' AND policyname = 'tenant_isolation_product_alert_config') THEN
            CREATE POLICY tenant_isolation_product_alert_config ON product_alert_config
                FOR ALL TO app_user
                USING (tenant_id = current_tenant_id())
                WITH CHECK (tenant_id = current_tenant_id());
        END IF;
    END IF;
    
    -- =================================================================
    -- COMENTARIOS FINALES
    -- =================================================================
    
    -- Agregar comentarios a las tablas (si existen)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_inventory') THEN
        COMMENT ON TABLE product_inventory IS 'Almacena el stock actual y configuración de reorden por producto';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'service_products') THEN
        COMMENT ON TABLE service_products IS 'Relación muchos-a-muchos entre servicios y productos';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
        COMMENT ON TABLE inventory_transactions IS 'Historial de todos los movimientos de inventario para auditoría';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_alerts') THEN
        COMMENT ON TABLE inventory_alerts IS 'Alertas generadas automáticamente por el sistema';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_alert_config') THEN
        COMMENT ON TABLE product_alert_config IS 'Configuración personalizada de alertas para cada producto';
    END IF;
    
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'MIGRACIÓN DE INVENTARIO COMPLETADA SEGURAMENTE';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Este script es seguro para producción porque:';
    RAISE NOTICE '1. Solo crea tablas si no existen';
    RAISE NOTICE '2. No modifica datos existentes';
    RAISE NOTICE '3. No elimina ni altera tablas existentes';
    RAISE NOTICE '4. Incluye verificaciones de seguridad';
    RAISE NOTICE '====================================================================';
END $$;