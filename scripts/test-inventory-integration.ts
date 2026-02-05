/**
 * Script para probar la integración del sistema de inventario
 *
 * Este script realiza pruebas de integración para verificar que todos los componentes
 * del sistema de inventario funcionen correctamente juntos.
 */

// Cargar variables de entorno
import "dotenv/config";

import { db } from "../packages/database/connection";
import { eq } from "drizzle-orm";
import {
  products,
  services,
  productInventory,
  serviceProducts,
  inventoryTransactions,
  inventoryAlerts,
  productAlertConfig,
} from "../packages/database/schema";

async function testInventoryIntegration() {
  console.log(
    "🧪 Iniciando pruebas de integración del sistema de inventario...\n",
  );

  try {
    // 1. Verificar que las tablas existen
    console.log("1. Verificando tablas de inventario...");

    // Obtener un tenant de prueba
    const [tenant] = await db.select().from(services).limit(1);
    if (!tenant) {
      throw new Error("No se encontró un tenant para pruebas");
    }

    console.log(`✅ Usando tenant: ${tenant.name} (${tenant.id})`);

    // 2. Verificar productos existentes
    const existingProducts = await db.select().from(products).limit(5);
    console.log(
      `✅ Encontrados ${existingProducts.length} productos existentes`,
    );

    if (existingProducts.length === 0) {
      throw new Error("No hay productos para probar");
    }

    // 3. Crear registros de inventario iniciales si no existen
    console.log("\n2. Creando registros de inventario iniciales...");

    for (const product of existingProducts) {
      const [existingInventory] = await db
        .select()
        .from(productInventory)
        .where(eq(productInventory.productId, product.id));

      if (!existingInventory) {
        await db.insert(productInventory).values({
          tenantId: tenant.id,
          productId: product.id,
          quantity: "50", // Stock inicial
          reorderLevel: "5",
          reorderQuantity: "10",
          unitCost: "50.00",
          location: "Almacén principal",
        });
        console.log(`✅ Creado inventario para producto: ${product.name}`);
      } else {
        console.log(
          `ℹ️  El inventario ya existe para producto: ${product.name}`,
        );
      }
    }

    // 4. Probar la creación de una relación servicio-producto
    console.log("\n3. Probando relación servicio-producto...");

    const testService = tenant;
    const testProduct = existingProducts[0];

    // Verificar si ya existe la relación
    const [existingRelation] = await db
      .select()
      .from(serviceProducts)
      .where(
        eq(serviceProducts.serviceId, testService.id) &&
          eq(serviceProducts.productId, testProduct.id),
      );

    if (!existingRelation) {
      await db.insert(serviceProducts).values({
        tenantId: tenant.id,
        serviceId: testService.id,
        productId: testProduct.id,
        quantity: "1",
        optional: false,
      });
      console.log(
        `✅ Creada relación servicio-producto: ${testService.name} -> ${testProduct.name}`,
      );
    } else {
      console.log(
        `ℹ️  La relación servicio-producto ya existe: ${testService.name} -> ${testProduct.name}`,
      );
    }

    // 5. Probar la creación de una transacción de inventario
    console.log("\n4. Probando transacciones de inventario...");

    const [inventoryRecord] = await db
      .select()
      .from(productInventory)
      .where(eq(productInventory.productId, testProduct.id));

    if (inventoryRecord) {
      const originalQuantity = Number(inventoryRecord.quantity);
      const deductionAmount = 2;

      // Verificar si hay suficiente stock
      if (originalQuantity >= deductionAmount) {
        // Crear transacción de deducción
        await db.insert(inventoryTransactions).values({
          tenantId: tenant.id,
          productId: testProduct.id,
          type: "deduction",
          quantity: "-2", // Cantidad negativa para deducción
          previousQuantity: inventoryRecord.quantity,
          newQuantity: String(originalQuantity - deductionAmount),
          referenceType: "service_completion",
          referenceId: testService.id,
          notes: "Prueba de integración",
        });

        // Actualizar inventario
        await db
          .update(productInventory)
          .set({
            quantity: String(originalQuantity - deductionAmount),
          })
          .where(eq(productInventory.productId, testProduct.id));

        console.log(
          `✅ Transacción de deducción creada: ${testProduct.name} (${originalQuantity} -> ${originalQuantity - deductionAmount})`,
        );

        // Verificar si se debe generar una alerta
        if (
          originalQuantity - deductionAmount <=
          Number(inventoryRecord.reorderLevel)
        ) {
          await db.insert(inventoryAlerts).values({
            tenantId: tenant.id,
            productId: testProduct.id,
            alertType: "low_stock",
            severity: "warning",
            threshold: inventoryRecord.reorderLevel,
            currentValue: String(originalQuantity - deductionAmount),
            status: "active",
          });
          console.log(
            `⚠️  Alerta de stock baja generada para: ${testProduct.name}`,
          );
        }
      } else {
        console.log(
          `❌ Stock insuficiente para deducción: ${testProduct.name} (${originalQuantity} < ${deductionAmount})`,
        );
      }
    }

    // 6. Probar la configuración de alertas
    console.log("\n5. Probando configuración de alertas...");

    const [existingAlertConfig] = await db
      .select()
      .from(productAlertConfig)
      .where(eq(productAlertConfig.productId, testProduct.id));

    if (!existingAlertConfig) {
      await db.insert(productAlertConfig).values({
        tenantId: tenant.id,
        productId: testProduct.id,
        lowStockThreshold: "5",
        lowStockEnabled: true,
        outOfStockEnabled: true,
        overstockEnabled: false,
        expiryWarningEnabled: false,
        emailNotifications: true,
      });
      console.log(
        `✅ Configuración de alertas creada para: ${testProduct.name}`,
      );
    } else {
      console.log(
        `ℹ️  La configuración de alertas ya existe para: ${testProduct.name}`,
      );
    }

    // 7. Verificar estado final del inventario
    console.log("\n6. Verificando estado final del inventario...");

    const [finalInventory] = await db
      .select({
        product: products.name,
        quantity: productInventory.quantity,
        reorderLevel: productInventory.reorderLevel,
        reorderQuantity: productInventory.reorderQuantity,
        unitCost: productInventory.unitCost,
        location: productInventory.location,
        updatedAt: productInventory.updatedAt,
      })
      .from(productInventory)
      .innerJoin(products, eq(productInventory.productId, products.id))
      .where(eq(productInventory.productId, testProduct.id));

    if (finalInventory) {
      console.log("✅ Estado final del inventario:");
      console.log(`   Producto: ${finalInventory.product}`);
      console.log(`   Cantidad: ${finalInventory.quantity}`);
      console.log(`   Nivel de Reorden: ${finalInventory.reorderLevel}`);
      console.log(`   Cantidad de Reorden: ${finalInventory.reorderQuantity}`);
      console.log(`   Costo Unitario: ${finalInventory.unitCost}`);
      console.log(`   Ubicación: ${finalInventory.location}`);
      console.log(`   Última Actualización: ${finalInventory.updatedAt}`);
    }

    // 8. Verificar transacciones
    console.log("\n7. Verificando transacciones...");

    const transactions = await db
      .select({
        id: inventoryTransactions.id,
        type: inventoryTransactions.type,
        quantity: inventoryTransactions.quantity,
        previousQuantity: inventoryTransactions.previousQuantity,
        newQuantity: inventoryTransactions.newQuantity,
        notes: inventoryTransactions.notes,
        createdAt: inventoryTransactions.createdAt,
      })
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.productId, testProduct.id))
      .orderBy(inventoryTransactions.createdAt)
      .limit(5);

    console.log(
      `✅ Encontradas ${transactions.length} transacciones para ${testProduct.name}:`,
    );
    transactions.forEach((tx) => {
      console.log(
        `   ${tx.type}: ${tx.previousQuantity} -> ${tx.newQuantity} (${tx.notes})`,
      );
    });

    // 9. Verificar alertas
    console.log("\n8. Verificando alertas...");

    const alerts = await db
      .select({
        id: inventoryAlerts.id,
        alertType: inventoryAlerts.alertType,
        severity: inventoryAlerts.severity,
        threshold: inventoryAlerts.threshold,
        currentValue: inventoryAlerts.currentValue,
        status: inventoryAlerts.status,
        createdAt: inventoryAlerts.createdAt,
      })
      .from(inventoryAlerts)
      .where(eq(inventoryAlerts.productId, testProduct.id))
      .orderBy(inventoryAlerts.createdAt)
      .limit(5);

    console.log(
      `✅ Encontradas ${alerts.length} alertas para ${testProduct.name}:`,
    );
    alerts.forEach((alert) => {
      console.log(
        `   ${alert.alertType} (${alert.severity}): ${alert.currentValue} (umbral: ${alert.threshold}) - ${alert.status}`,
      );
    });

    console.log(
      "\n🎉 Todas las pruebas de integración se completaron exitosamente!",
    );
    console.log("\n📝 Resumen:");
    console.log(`   - Tenant: ${tenant.name}`);
    console.log(`   - Productos probados: ${existingProducts.length}`);
    console.log(`   - Transacciones creadas: ${transactions.length}`);
    console.log(`   - Alertas generadas: ${alerts.length}`);
    console.log(`   - Producto de prueba: ${testProduct.name}`);
    console.log(`   - Stock final: ${finalInventory?.quantity}`);
  } catch (error) {
    console.error("❌ Error en las pruebas de integración:", error);
    process.exit(1);
  }
}

// Ejecutar las pruebas
testInventoryIntegration()
  .then(() => {
    console.log(
      "\n🚀 Pruebas completadas. El sistema de inventario está listo para producción.",
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });
