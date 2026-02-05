-- =================================================================
-- Migración de Base de Datos: Sistema de Inventario
-- =================================================================
-- Este script crea las tablas necesarias para el sistema de inventario
-- y establece las relaciones con las tablas existentes
-- =================================================================

-- Habilitar la extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- TABLAS PRINCIPALES
-- =================================================================

-- 1. Tabla de Inventario de Productos
-- Almacena el stock actual y configuración de reorden por producto
CREATE TABLE IF NOT EXISTS product_inventory (
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

-- 2. Tabla de Productos por Servicio
-- Relación muchos-a-muchos entre servicios y productos
CREATE TABLE IF NOT EXISTS service_products (
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

-- 3. Tabla de Transacciones de Inventario
-- Historial de todos los movimientos de inventario para auditoría
CREATE TABLE IF NOT EXISTS inventory_transactions (
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

-- 4. Tabla de Alertas de Inventario
-- Alertas generadas automáticamente por el sistema
CREATE TABLE IF NOT EXISTS inventory_alerts (
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

-- 5. Tabla de Configuración de Alertas por Producto
-- Configuración personalizada de alertas para cada producto
CREATE TABLE IF NOT EXISTS product_alert_config (
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

-- =================================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- =================================================================

-- Índices para product_inventory
CREATE INDEX IF NOT EXISTS idx_product_inventory_tenant_product ON product_inventory(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_tenant ON product_inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_product ON product_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_tenant_low_stock ON product_inventory(tenant_id, quantity);
CREATE INDEX IF NOT EXISTS idx_product_inventory_tenant_reorder ON product_inventory(tenant_id, reorder_level);

-- Índices para service_products
CREATE INDEX IF NOT EXISTS idx_service_products_tenant_service_product ON service_products(tenant_id, service_id, product_id);
CREATE INDEX IF NOT EXISTS idx_service_products_tenant ON service_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_products_service ON service_products(service_id);
CREATE INDEX IF NOT EXISTS idx_service_products_product ON service_products(product_id);
CREATE INDEX IF NOT EXISTS idx_service_products_service_tenant ON service_products(service_id, tenant_id);

-- Índices para inventory_transactions
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_tenant ON inventory_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference ON inventory_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_tenant_product_type ON inventory_transactions(tenant_id, product_id, type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_tenant_date ON inventory_transactions(tenant_id, created_at);

-- Índices para inventory_alerts
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_tenant ON inventory_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_alert_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_severity ON inventory_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_status ON inventory_alerts(status);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_created_at ON inventory_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_tenant_active ON inventory_alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_tenant_severity ON inventory_alerts(tenant_id, severity);

-- Índices para product_alert_config
CREATE INDEX IF NOT EXISTS idx_product_alert_config_tenant_product ON product_alert_config(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_product_alert_config_tenant ON product_alert_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_alert_config_product ON product_alert_config(product_id);

-- =================================================================
-- RESTRICCIONES ÚNICAS
-- =================================================================

-- Asegurar que cada producto tenga solo un registro de inventario por tenant
ALTER TABLE product_inventory ADD CONSTRAINT IF NOT EXISTS uc_tenant_product UNIQUE (tenant_id, product_id);

-- Asegurar que cada combinación servicio-producto sea única por tenant
ALTER TABLE service_products ADD CONSTRAINT IF NOT EXISTS uc_tenant_service_product UNIQUE (tenant_id, service_id, product_id);

-- Asegurar que cada producto tenga solo una configuración de alertas por tenant
ALTER TABLE product_alert_config ADD CONSTRAINT IF NOT EXISTS uc_tenant_product_alert_config UNIQUE (tenant_id, product_id);

-- =================================================================
-- TRIGGERS PARA ACTUALIZACIÓN DE TIMESTAMP
-- =================================================================

-- Trigger para actualizar updated_at en product_inventory
CREATE OR REPLACE FUNCTION update_product_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_product_inventory_updated_at
    BEFORE UPDATE ON product_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_product_inventory_updated_at();

-- Trigger para actualizar updated_at en service_products
CREATE OR REPLACE FUNCTION update_service_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_service_products_updated_at
    BEFORE UPDATE ON service_products
    FOR EACH ROW
    EXECUTE FUNCTION update_service_products_updated_at();

-- Trigger para actualizar updated_at en inventory_alerts
CREATE OR REPLACE FUNCTION update_inventory_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_inventory_alerts_updated_at
    BEFORE UPDATE ON inventory_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_alerts_updated_at();

-- Trigger para actualizar updated_at en product_alert_config
CREATE OR REPLACE FUNCTION update_product_alert_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_product_alert_config_updated_at
    BEFORE UPDATE ON product_alert_config
    FOR EACH ROW
    EXECUTE FUNCTION update_product_alert_config_updated_at();

-- =================================================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- =================================================================

-- Habilitar RLS en todas las tablas de inventario
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_alert_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para product_inventory
CREATE POLICY tenant_isolation_product_inventory ON product_inventory
    FOR ALL TO app_user
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Políticas RLS para service_products
CREATE POLICY tenant_isolation_service_products ON service_products
    FOR ALL TO app_user
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Políticas RLS para inventory_transactions
CREATE POLICY tenant_isolation_inventory_transactions ON inventory_transactions
    FOR ALL TO app_user
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Políticas RLS para inventory_alerts
CREATE POLICY tenant_isolation_inventory_alerts ON inventory_alerts
    FOR ALL TO app_user
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Políticas RLS para product_alert_config
CREATE POLICY tenant_isolation_product_alert_config ON product_alert_config
    FOR ALL TO app_user
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- =================================================================
-- COMENTARIOS FINALES
-- =================================================================

COMMENT ON TABLE product_inventory IS 'Almacena el stock actual y configuración de reorden por producto';
COMMENT ON TABLE service_products IS 'Relación muchos-a-muchos entre servicios y productos';
COMMENT ON TABLE inventory_transactions IS 'Historial de todos los movimientos de inventario para auditoría';
COMMENT ON TABLE inventory_alerts IS 'Alertas generadas automáticamente por el sistema';
COMMENT ON TABLE product_alert_config IS 'Configuración personalizada de alertas para cada producto';

-- =================================================================
-- FIN DE LA MIGRACIÓN
-- =================================================================