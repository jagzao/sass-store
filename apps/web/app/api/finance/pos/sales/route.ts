import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { assertTenantAccess } from "@/lib/auth/api-auth";
import { db } from "@sass-store/database";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener datos del body
    const body = await request.json();
    const { customerId, items, paymentMethod, totalAmount, notes, tenantSlug } =
      body;

    if (!tenantSlug) {
      return NextResponse.json(
        { error: "Tenant parameter is required" },
        { status: 400 },
      );
    }

    // Validar datos
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 },
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 },
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: "Total amount must be greater than 0" },
        { status: 400 },
      );
    }

    // Obtener tenant ID desde el slug
    const tenantResult = await db.execute(
      sql`SELECT id FROM tenants WHERE slug = ${tenantSlug}`,
    );

    if (!tenantResult.rows || tenantResult.rows.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenantResult.rows[0].id;

    // Validar acceso al tenant
    try {
      assertTenantAccess(session, tenantSlug);
    } catch (error) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to this tenant" },
        { status: 403 },
      );
    }

    // Iniciar transacción
    const result = await db.transaction(async (tx) => {
      // Crear la orden
      const orderResult = await tx.execute(
        sql`
          INSERT INTO orders (
            tenant_id,
            customer_id,
            status,
            total_amount,
            notes,
            created_by,
            created_at
          ) VALUES (
            ${tenantId},
            ${customerId || null},
            'completed',
            ${totalAmount},
            ${notes || null},
            ${session.user.id},
            NOW()
          ) RETURNING id
        `,
      );

      const orderId = orderResult.rows[0].id;

      // Crear los items de la orden
      for (const item of items) {
        await tx.execute(
          sql`
            INSERT INTO order_items (
              order_id,
              product_id,
              quantity,
              unit_price,
              total_price
            ) VALUES (
              ${orderId},
              ${item.productId},
              ${item.quantity},
              ${item.unitPrice},
              ${item.totalPrice}
            )
          `,
        );
      }

      // Crear el pago
      const paymentResult = await tx.execute(
        sql`
          INSERT INTO payments (
            order_id,
            amount,
            payment_method,
            status,
            created_at
          ) VALUES (
            ${orderId},
            ${totalAmount},
            ${paymentMethod},
            'completed',
            NOW()
          ) RETURNING id
        `,
      );

      const paymentId = paymentResult.rows[0].id;

      // Crear el movimiento financiero
      await tx.execute(
        sql`
          INSERT INTO financial_movements (
            tenant_id,
            type,
            amount,
            payment_method,
            description,
            reference_id,
            movement_date,
            reconciled
          ) VALUES (
            ${tenantId},
            'income',
            ${totalAmount},
            ${paymentMethod},
            ${notes || `Venta POS - Orden ${orderId}`},
            ${orderId},
            NOW(),
            false
          )
        `,
      );

      return { orderId, paymentId };
    });

    // Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      message: "Sale created successfully",
      data: {
        orderId: result.orderId,
        paymentId: result.paymentId,
      },
    });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 },
    );
  }
}
