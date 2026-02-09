import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../_lib/tenant-context";

// Esquemas de validación
const querySchema = z.object({
  reportType: z.enum([
    "low_stock",
    "stock_value",
    "movement_summary",
    "product_performance",
  ]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: z.string().optional(),
  format: z.enum(["json", "csv"]).optional().default("json"),
});

/**
 * GET /api/inventory/reports - Generar reportes de inventario
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Parsear y validar query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Convertir fechas a objetos Date si se proporcionan
    const processedQuery = {
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    // Generar reporte según el tipo
    let report;
    switch (query.reportType) {
      case "low_stock":
        report = await InventoryService.getLowStockReport(
          tenantContext.data.tenantId,
        );
        break;
      case "stock_value":
        report = await InventoryService.getStockValueReport(
          tenantContext.data.tenantId,
          processedQuery.category,
        );
        break;
      case "movement_summary":
        report = await InventoryService.getMovementSummaryReport(
          tenantContext.data.tenantId,
          processedQuery.startDate,
          processedQuery.endDate,
        );
        break;
      case "product_performance":
        report = await InventoryService.getProductPerformanceReport(
          tenantContext.data.tenantId,
          processedQuery.startDate,
          processedQuery.endDate,
        );
        break;
      default:
        return NextResponse.json(
          { error: "Tipo de reporte inválido" },
          { status: 400 },
        );
    }

    if (!report.success) {
      return toInventoryErrorResponse(report.error);
    }

    // Si el formato es CSV, generar respuesta CSV
    if (query.format === "csv") {
      const csvContent = generateCSV(report.data);
      const filename = `inventory_${query.reportType}_report_${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      reportType: query.reportType,
      generatedAt: new Date().toISOString(),
      data: report.data,
    });
  } catch (error) {
    console.error("Error en GET /api/inventory/reports:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// Función auxiliar para generar CSV
function generateCSV(data: any): string {
  if (!data || !Array.isArray(data)) {
    throw new Error("Datos no válidos para generar CSV");
  }

  if (data.length === 0) {
    return "No data available";
  }

  // Obtener encabezados
  const headers = Object.keys(data[0]);

  // Crear línea de encabezados
  const headerLine = headers.join(",");

  // Crear líneas de datos
  const dataLines = data.map((row: any) => {
    return headers
      .map((header) => {
        const value = row[header];
        // Escapar comillas y envolver en comillas si contiene comas o comillas
        if (
          typeof value === "string" &&
          (value.includes(",") || value.includes('"'))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",");
  });

  return [headerLine, ...dataLines].join("\n");
}
