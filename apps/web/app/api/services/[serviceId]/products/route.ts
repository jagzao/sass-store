import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

// Esquemas de validación
const addProductSchema = z.object({
  productId: z.string().uuid("ID de producto inválido"),
  quantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Cantidad debe ser un número válido")
    .optional()
    .default("1"),
  optional: z.boolean().optional().default(false),
  metadata: z.record(z.any()).optional(),
});

interface RouteParams {
  params: {
    serviceId: string;
  };
}

/**
 * GET /api/services/[serviceId]/products - Obtener productos asociados a un servicio
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener tenant del usuario
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 400 },
      );
    }

    // Obtener serviceId de los params
    const { serviceId } = context.params;

    // Obtener productos del servicio
    const serviceProducts = await InventoryService.getServiceProducts(
      serviceId,
      tenantId,
    );

    return NextResponse.json(serviceProducts);
  } catch (error) {
    console.error("Error en GET /api/services/[serviceId]/products:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/services/[serviceId]/products - Asociar producto a servicio
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener tenant del usuario
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 400 },
      );
    }

    // Obtener serviceId de los params
    const { serviceId } = context.params;

    // Parsear y validar body
    const body = await request.json();
    const validatedData = addProductSchema.parse(body);

    // Asociar producto a servicio
    const result = await InventoryService.addProductToService({
      tenantId,
      serviceId,
      ...validatedData,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/services/[serviceId]/products:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
