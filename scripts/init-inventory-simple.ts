import { db } from "../packages/database/connection";
import {
  products,
  tenants,
  productInventory,
} from "../packages/database/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Script simplificado para inicializar inventario
 */
async function initializeInventory() {
  try {
    console.log("🔄 Iniciando migración de inventario...");

    // Obtener todos los tenants
    const allTenants = await db.select().from(tenants);
    console.log(`✅ Encontrados ${allTenants.length} tenants`);

    let totalProductsProcessed = 0;
    let totalInventoryCreated = 0;

    // Procesar cada tenant
    for (const tenant of allTenants) {
      console.log(`📝 Procesando tenant: ${tenant.name} (${tenant.id})`);

      // Obtener todos los productos del tenant
      const tenantProducts = await db
        .select()
        .from(products)
        .where(eq(products.tenantId, tenant.id));

      console.log(
        `  - Encontrados ${tenantProducts.length} productos para el tenant`,
      );

      if (tenantProducts.length === 0) {
        console.log(`  - No hay productos para procesar, saltando tenant...`);
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

      console.log(
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
          unitCost: product.price?.toString() || "0", // Usar el precio del producto como costo inicial
          location: "Principal", // Ubicación predeterminada
          metadata: {
            source: "initial_migration",
            productName: product.name,
            productSku: product.sku,
          },
        }));

      if (inventoryToCreate.length > 0) {
        await db.insert(productInventory).values(inventoryToCreate);
        console.log(
          `  - ✅ Creados ${inventoryToCreate.length} registros de inventario`,
        );
        totalInventoryCreated += inventoryToCreate.length;
      } else {
        console.log(
          `  - ℹ️ Todos los productos ya tienen inventario configurado`,
        );
      }

      totalProductsProcessed += tenantProducts.length;
    }

    console.log("=== Resumen de la migración ===");
    console.log(`Total de productos procesados: ${totalProductsProcessed}`);
    console.log(
      `Total de registros de inventario creados: ${totalInventoryCreated}`,
    );
    console.log("✅ Migración completada exitosamente");

    // Verificación final
    const finalInventoryCount = await db
      .select({ count: sql`count(*)` })
      .from(productInventory);

    console.log(
      `Total de registros de inventario en la base de datos: ${finalInventoryCount[0].count}`,
    );
  } catch (error) {
    console.error("❌ Error durante la migración de inventario:", error);
    throw error;
  }
}

// Ejecutar la migración
initializeInventory()
  .then(() => {
    console.log("✅ Script de migración finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error en el script de migración:", error);
    process.exit(1);
  });
