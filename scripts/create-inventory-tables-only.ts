/**
 * Script para crear solo las tablas de inventario
 */

import "dotenv/config";
import { db } from "../packages/database/connection";
import { sql } from "drizzle-orm";

async function createInventoryTables() {
  console.log("🔄 Creando tablas de inventario...");

  try {
    // Crear tabla product_inventory
    console.log("📝 Creando tabla product_inventory...");
    await db.execute(sql`
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
    `);
    console.log("✅ Tabla product_inventory creada correctamente");

    // Crear tabla service_products
    console.log("📝 Creando tabla service_products...");
    await db.execute(sql`
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
    `);
    console.log("✅ Tabla service_products creada correctamente");

    // Crear tabla inventory_transactions
    console.log("📝 Creando tabla inventory_transactions...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL,
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
    `);
    console.log("✅ Tabla inventory_transactions creada correctamente");

    // Crear tabla inventory_alerts
    console.log("📝 Creando tabla inventory_alerts...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inventory_alerts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          alert_type VARCHAR(50) NOT NULL,
          severity VARCHAR(20) NOT NULL DEFAULT 'medium',
          threshold DECIMAL(10,2),
          current_value DECIMAL(10,2),
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          acknowledged_by TEXT REFERENCES users(id),
          acknowledged_at TIMESTAMP WITH TIME ZONE,
          resolved_at TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✅ Tabla inventory_alerts creada correctamente");

    // Crear tabla product_alert_config
    console.log("📝 Creando tabla product_alert_config...");
    await db.execute(sql`
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
    `);
    console.log("✅ Tabla product_alert_config creada correctamente");

    console.log("🎉 Tablas de inventario creadas exitosamente!");
  } catch (error) {
    console.error("❌ Error fatal al crear las tablas:", error);
    process.exit(1);
  }
}

createInventoryTables()
  .then(() => {
    console.log("✅ Proceso de creación de tablas finalizado.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });
