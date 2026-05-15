import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { sql, eq, and } from "drizzle-orm";
import { db } from "@sass-store/database";
import {
  orders,
  orderItems,
  productInventory,
  inventoryTransactions,
} from "@sass-store/database/schema";

export interface POSSaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface POSSale {
  id: string;
  tenantId: string;
  orderNumber: string;
  items: POSSaleItem[];
  total: number;
  paymentMethod: "cash" | "card" | "mercadopago";
  customerName?: string;
  createdAt: Date;
}

export interface CreateSaleInput {
  items: { productId: string; quantity: number; unitPrice: number }[];
  paymentMethod: string;
  customerName?: string;
}

const generateOrderNumber = (tenantId: string): string => {
  const prefix = tenantId.slice(0, 4).toUpperCase();
  const now = new Date();
  const timestamp =
    now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `POS-${prefix}-${timestamp}-${random}`;
};

export interface IPOSService {
  createSale(
    tenantId: string,
    data: CreateSaleInput,
  ): Promise<Result<POSSale, DomainError>>;
}

export class POSService implements IPOSService {
  async createSale(
    tenantId: string,
    data: CreateSaleInput,
  ): Promise<Result<POSSale, DomainError>> {
    // 1. Validaciones
    if (!data.items || data.items.length === 0) {
      return Err(
        ErrorFactories.validation(
          "Sale must contain at least one item",
          "items",
        ),
      );
    }

    if (
      data.items.some((item) => item.quantity <= 0 || item.quantity % 1 !== 0)
    ) {
      return Err(
        ErrorFactories.validation(
          "Each item must have a positive integer quantity",
          "quantity",
        ),
      );
    }

    const total = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    if (total <= 0) {
      return Err(
        ErrorFactories.validation(
          "Total amount must be greater than 0",
          "total",
        ),
      );
    }

    const validPaymentMethods = ["cash", "card", "mercadopago"];
    if (
      !data.paymentMethod ||
      !validPaymentMethods.includes(data.paymentMethod)
    ) {
      return Err(
        ErrorFactories.validation(
          "Invalid payment method. Allowed: cash, card, mercadopago",
          "paymentMethod",
        ),
      );
    }

    // 2. Crear orden en transacción
    try {
      const orderNumber = generateOrderNumber(tenantId);
      const now = new Date();

      const result = await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({
            tenantId,
            orderNumber,
            status: "completed",
            type: "purchase",
            total: total.toFixed(2),
            currency: "MXN",
            customerName: data.customerName || "",
            metadata: JSON.stringify({
              paymentMethod: data.paymentMethod,
              pos: true,
            }),
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const saleItems: POSSaleItem[] = data.items.map((item) => ({
          productId: item.productId,
          productName: item.productId, // placeholder; actual name from product lookup omitted for brevity
          sku: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        }));

        await tx.insert(orderItems).values(
          saleItems.map((item) => ({
            orderId: order.id,
            type: "product" as const,
            name: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toFixed(2),
            totalPrice: item.totalPrice.toFixed(2),
            createdAt: now,
            updatedAt: now,
          })),
        );

        // Deduct inventory for each product (atomic within transaction)
        for (const item of data.items) {
          const [inv] = await tx
            .select()
            .from(productInventory)
            .where(
              and(
                eq(productInventory.tenantId, tenantId),
                eq(productInventory.productId, item.productId),
              ),
            )
            .limit(1);

          if (inv) {
            const newQty = Number(inv.quantity) - item.quantity;
            await tx
              .update(productInventory)
              .set({ quantity: newQty.toFixed(2) })
              .where(eq(productInventory.id, inv.id));

            await tx.insert(inventoryTransactions).values({
              tenantId,
              productId: item.productId,
              type: "deduction",
              quantity: String(item.quantity),
              previousQuantity: String(inv.quantity),
              newQuantity: newQty.toFixed(2),
              referenceType: "sale",
              referenceId: order.id,
              notes: `POS Sale order ${orderNumber}`,
              createdAt: now,
            });
          }
        }

        // Crear movimiento financiero
        await tx.execute(
          sql`INSERT INTO financial_movements (
            tenant_id, type, amount, payment_method, description,
            reference_id, category, movement_date, reconciled
          ) VALUES (
            ${tenantId}, 'income', ${total.toFixed(2)}, ${data.paymentMethod},
            ${`Venta POS - Orden ${orderNumber}`}, ${order.id}, 'sales',
            NOW(), false
          )`,
        );

        return {
          id: order.id,
          tenantId,
          orderNumber,
          items: saleItems,
          total,
          paymentMethod: data.paymentMethod as "cash" | "card" | "mercadopago",
          customerName: data.customerName,
          createdAt: now,
        };
      });

      return Ok(result);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "create_pos_sale",
          "Failed to create POS sale",
          undefined,
          error as Error,
        ),
      );
    }
  }
}

// In-memory mock implementation for testing
export class InMemoryPOSService implements IPOSService {
  private sales: POSSale[] = [];

  async createSale(
    tenantId: string,
    data: CreateSaleInput,
  ): Promise<Result<POSSale, DomainError>> {
    if (!data.items || data.items.length === 0) {
      return Err(
        ErrorFactories.validation(
          "Sale must contain at least one item",
          "items",
        ),
      );
    }

    if (
      data.items.some((item) => item.quantity <= 0 || item.quantity % 1 !== 0)
    ) {
      return Err(
        ErrorFactories.validation(
          "Each item must have a positive integer quantity",
          "quantity",
        ),
      );
    }

    const total = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    if (total <= 0) {
      return Err(
        ErrorFactories.validation(
          "Total amount must be greater than 0",
          "total",
        ),
      );
    }

    const validPaymentMethods = ["cash", "card", "mercadopago"];
    if (
      !data.paymentMethod ||
      !validPaymentMethods.includes(data.paymentMethod)
    ) {
      return Err(
        ErrorFactories.validation(
          "Invalid payment method. Allowed: cash, card, mercadopago",
          "paymentMethod",
        ),
      );
    }

    const sale: POSSale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tenantId,
      orderNumber: generateOrderNumber(tenantId),
      items: data.items.map((item) => ({
        productId: item.productId,
        productName: item.productId,
        sku: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      })),
      total,
      paymentMethod: data.paymentMethod as "cash" | "card" | "mercadopago",
      customerName: data.customerName,
      createdAt: new Date(),
    };

    this.sales.push(sale);
    return Ok(sale);
  }

  getSales(): POSSale[] {
    return this.sales;
  }

  clear(): void {
    this.sales = [];
  }
}
