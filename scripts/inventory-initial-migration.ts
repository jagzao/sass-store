import { db } from "../packages/database/connection";
import {
  products,
  tenants,
  productInventory,
} from "../packages/database/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Script de migración inicial para el sistema de inventario
 *
 * Este script:
 * 1. Crea registros de inventario para todos los productos existentes
 * 2. Inicializa el stock en 0 para todos los productos
 * 3. Establece valores predeterminados para reorder_level y reorder_quantity
 *
 * Uso: npx ts-node scripts/inventory-initial-migration.ts
 */

async function initializeInventory() {
  try {
    logger.info("Iniciando migración de inventario...");

    // Obtener todos los tenants
    const allTenants = await db.select().from(tenants);
    logger.info(`Encontrados ${allTenants.length} tenants`);

    let totalProductsProcessed = 0;
    let totalInventoryCreated = 0;

    // Procesar cada tenant
    for (const tenant of allTenants) {
      logger.info(`Procesando tenant: ${tenant.name} (${tenant.id})`);

      // Obtener todos los productos del tenant
      const tenantProducts = await db
        .select()
        .from(products)
        .where(eq(products.tenantId, tenant.id));

      logger.info(
        `  - Encontrados ${tenantProducts.length} productos para el tenant`,
      );

      if (tenantProducts.length === 0) {
        logger.info(`  - No hay productos para procesar, saltando tenant...`);
        continue;
      }

      // Verificar qué productos ya tienen inventario
      const existingInventory = await db
        .select()
        .from(productInventory)
        .where(eq(productInventory.tenantId, tenant.id));

      const existingProductIds = new Set(
        existingInventory.map((inv) => inv.productId),
      );

      logger.info(
        `  - ${existingInventory.length} productos ya tienen inventario configurado`,
      );

      // Crear registros de inventario para productos que no lo tienen
      const inventoryToCreate = tenantProducts
        .filter((product) => !existingProductIds.has(product.id))
        .map((product) => ({
          tenantId: tenant.id,
          productId: product.id,
          quantity: "0", // Inicializar con stock 0
          reorderLevel: "5", // Valor predeterminado
          reorderQuantity: "10", // Valor predeterminado
          unitCost: product.price.toString(), // Usar el precio del producto como costo inicial
          location: "Principal", // Ubicación predeterminada
          metadata: {
            source: "initial_migration",
            productName: product.name,
            productSku: product.sku,
          },
        }));

      if (inventoryToCreate.length > 0) {
        await db.insert(productInventory).values(inventoryToCreate);
        logger.info(
          `  - Creados ${inventoryToCreate.length} registros de inventario`,
        );
        totalInventoryCreated += inventoryToCreate.length;
      } else {
        logger.info(`  - Todos los productos ya tienen inventario configurado`);
      }

      totalProductsProcessed += tenantProducts.length;
    }

    logger.info("=== Resumen de la migración ===");
    logger.info(`Total de productos procesados: ${totalProductsProcessed}`);
    logger.info(
      `Total de registros de inventario creados: ${totalInventoryCreated}`,
    );
    logger.info("Migración completada exitosamente");

    // Verificación final
    const finalInventoryCount = await db
      .select({ count: sql`count(*)` })
      .from(productInventory);

    logger.info(
      `Total de registros de inventario en la base de datos: ${finalInventoryCount[0].count}`,
    );
  } catch (error) {
    logger.error("Error durante la migración de inventario:", error);
    throw error;
  }
}

// Importar sql para la consulta de conteo
import { sql } from "drizzle-orm";

// Ejecutar la migración
if (require.main === module) {
  initializeInventory()
    .then(() => {
      logger.info("Script de migración finalizado");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Error en el script de migración:", error);
      process.exit(1);
    });
}

export { initializeInventory };
