"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";
import FormSelect from "@/components/ui/forms/FormSelect";
import { useFinance } from "@/lib/hooks/use-finance";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { financeLogger } from "@/lib/logger";
import type { Tenant } from "@/types/tenant";
import type {
  SalesReport,
  ProductsReport,
  SaleData,
  ProductSalesData,
} from "@/types/reports";

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenant as string;

  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState<
    "sales" | "products" | "financial"
  >("sales");
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [productsReport, setProductsReport] = useState<ProductsReport | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [terminalId, setTerminalId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/t/${tenantSlug}/login`);
    }
  }, [status, router, tenantSlug]);

  useEffect(() => {
    const loadTenantData = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenantSlug}`);
        if (response.ok) {
          const tenantData = await response.json();
          setCurrentTenant(tenantData);
        }
      } catch (error) {
        financeLogger.warn("reports: loadTenantData failed", error);
      }
    };

    if (session?.user) {
      loadTenantData();
    }
  }, [session, tenantSlug]);

  const generateSalesReport = async () => {
    setLoading(true);
    try {
      const qp = new URLSearchParams();
      qp.append("tenant", tenantSlug); // required by API
      if (dateFrom) qp.append("from", new Date(dateFrom).toISOString());
      if (dateTo) qp.append("to", new Date(dateTo).toISOString());
      if (terminalId) qp.append("terminalId", terminalId);
      if (paymentMethod) qp.append("paymentMethod", paymentMethod);

      const response = await fetch(`/api/finance/reports/sales?${qp}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Error ${response.status}`);
      }

      // API returns { data: { salesByPeriod, paymentMethods, topProducts } }
      // — transform into the SalesReport shape the page expects.
      const apiData = await response.json();
      const salesByPeriod: any[] = apiData.data?.salesByPeriod ?? [];
      const payMethods: any[] = apiData.data?.paymentMethods ?? [];
      const topProds: any[] = apiData.data?.topProducts ?? [];

      const totalSales = salesByPeriod.reduce(
        (s: number, p: any) => s + (p.orderCount ?? 0),
        0,
      );
      const totalRevenue = salesByPeriod.reduce(
        (s: number, p: any) => s + (p.totalSales ?? 0),
        0,
      );
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
      const totalItems = topProds.reduce(
        (s: number, p: any) => s + (p.totalQuantity ?? 0),
        0,
      );
      const paymentMethodBreakdown = Object.fromEntries(
        payMethods.map((pm: any) => [pm.paymentMethod, pm.paymentCount]),
      );

      // Build SaleData rows from period aggregates (no transaction-level data from this endpoint)
      const data: SaleData[] = salesByPeriod.map((p: any, i: number) => ({
        id: String(i),
        orderNumber: p.period,
        customerName: `${p.orderCount} órdenes`,
        terminalId: undefined,
        total: p.totalSales?.toFixed(2),
        paymentMethod: undefined,
        createdAt: undefined,
      }));

      setSalesReport({
        data,
        summary: {
          totalSales,
          totalRevenue,
          averageOrderValue,
          totalItems,
          paymentMethodBreakdown,
        },
        filters: {},
        generatedAt: new Date().toISOString(),
      });

      toast.success("Reporte de ventas generado");
    } catch (error) {
      financeLogger.error("generateSalesReport failed", error);
      toast.error(
        `Error al generar el reporte de ventas: ${(error as Error).message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const generateProductsReport = async () => {
    setLoading(true);
    try {
      const qp = new URLSearchParams();
      qp.append("tenant", tenantSlug); // required by API
      if (dateFrom) qp.append("from", new Date(dateFrom).toISOString());
      if (dateTo) qp.append("to", new Date(dateTo).toISOString());
      if (category) qp.append("category", category);

      const response = await fetch(`/api/finance/reports/products?${qp}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Error ${response.status}`);
      }

      // API returns { data: { products, categories } }
      // — transform into the ProductsReport shape the page expects.
      const apiData = await response.json();
      const products: any[] = apiData.data?.products ?? [];

      const totalRevenue = products.reduce(
        (s: number, p: any) => s + (p.totalRevenue ?? 0),
        0,
      );
      const totalUnitsSold = products.reduce(
        (s: number, p: any) => s + (p.totalQuantity ?? 0),
        0,
      );
      const averagePrice =
        products.length > 0
          ? products.reduce((s: number, p: any) => s + (p.price ?? 0), 0) /
            products.length
          : 0;

      const data: ProductSalesData[] = products.map((p: any) => ({
        id: p.id,
        productId: p.id,
        name: p.name,
        sku: p.id, // no SKU in this API response
        category: p.category ?? "",
        price: p.price?.toString(),
        totalSold: p.totalQuantity,
        totalRevenue: p.totalRevenue,
        orderCount: p.orderCount,
      }));

      setProductsReport({
        data,
        summary: {
          totalProducts: products.length,
          totalRevenue,
          totalUnitsSold,
          averagePrice,
          topCategory: {},
        },
        filters: {},
        generatedAt: new Date().toISOString(),
      });

      toast.success("Reporte de productos generado");
    } catch (error) {
      financeLogger.error("generateProductsReport failed", error);
      toast.error(
        `Error al generar el reporte de productos: ${(error as Error).message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  /** Client-side export — no server round-trip needed */
  const exportReport = (exportFmt: "pdf" | "excel") => {
    const dateStr = new Date().toISOString().split("T")[0];

    if (exportFmt === "excel") {
      // Generate CSV (Excel opens .csv natively)
      let rows: string[][] = [];
      let filename = `reporte-${dateStr}.csv`;

      if (activeTab === "sales" && salesReport) {
        rows = [
          ["Período / Orden", "Órdenes", "Ingresos (MXN)", "Ticket Promedio"],
          ...salesReport.data.map((sale) => [
            sale.orderNumber ?? "",
            sale.customerName ?? "",
            sale.total ?? "0",
            "",
          ]),
          // Summary row
          ["", "", "", ""],
          [
            "TOTAL",
            String(salesReport.summary.totalSales),
            salesReport.summary.totalRevenue.toFixed(2),
            salesReport.summary.averageOrderValue.toFixed(2),
          ],
        ];
        filename = `ventas-${dateStr}.csv`;
      } else if (activeTab === "products" && productsReport) {
        rows = [
          ["Producto", "Categoría", "Precio", "Unidades Vendidas", "Ingresos"],
          ...productsReport.data.map((p) => [
            p.name,
            p.category ?? "",
            p.price ?? "0",
            String(p.totalSold ?? 0),
            String((p as any).totalRevenue ?? 0),
          ]),
        ];
        filename = `productos-${dateStr}.csv`;
      } else {
        toast.error("Genera el reporte primero antes de exportar.");
        return;
      }

      const csv =
        "﻿" + // BOM for Excel UTF-8
        rows
          .map((row) =>
            row
              .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
              .join(","),
          )
          .join("\r\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Reporte exportado: ${filename}`);
    } else {
      // PDF — browser print dialog
      toast.info(
        "Se abrirá el diálogo de impresión. Elige 'Guardar como PDF'.",
        { duration: 4000 },
      );
      setTimeout(() => window.print(), 400);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a
                href={`/t/${tenantSlug}`}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Volver a {currentTenant?.name || "Inicio"}
              </a>
              <h1 className="text-2xl font-bold text-gray-900">
                📊 Reportes y Análisis - {currentTenant?.name || "Negocio"}
              </h1>
            </div>
            <UserMenu tenantSlug={tenantSlug} />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              Filtros de Reporte
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terminal
                </label>
                <input
                  type="text"
                  value={terminalId}
                  onChange={(e) => setTerminalId(e.target.value)}
                  placeholder="ID de terminal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago
                </label>
                <FormSelect
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  selectClassName="w-full"
                  options={[
                    { value: "", label: "Todos" },
                    { value: "cash", label: "Efectivo" },
                    { value: "card", label: "Tarjeta" },
                    { value: "mercadopago", label: "Mercado Pago" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Categoría de producto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: "sales", label: "📈 Ventas", icon: "📈" },
                  { id: "products", label: "📦 Productos", icon: "📦" },
                  { id: "financial", label: "💰 Financiero", icon: "💰" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(tab.id as "sales" | "products" | "financial")
                    }
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Generate Report Button */}
          <div className="mb-8 flex justify-between items-center">
            <button
              onClick={
                activeTab === "sales"
                  ? generateSalesReport
                  : generateProductsReport
              }
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? "Generando..." : "📊 Generar Reporte"}
            </button>

            {(salesReport || productsReport) && (
              <div className="flex space-x-3">
                <button
                  onClick={() => exportReport("pdf")}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  📄 Exportar PDF
                </button>
                <button
                  onClick={() => exportReport("excel")}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  📊 Exportar Excel
                </button>
              </div>
            )}
          </div>

          {/* Sales Report */}
          {activeTab === "sales" && salesReport && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">🛒</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Ventas
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {salesReport.summary.totalSales}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">💰</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Ingresos Totales
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(salesReport.summary.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">📊</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Ticket Promedio
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(salesReport.summary.averageOrderValue)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">📦</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Productos Vendidos
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {salesReport.summary.totalItems}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900">
                  Métodos de Pago
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(
                    salesReport.summary.paymentMethodBreakdown,
                  ).map(([method, count]) => (
                    <div
                      key={method}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium capitalize">{method}</span>
                      <span className="font-bold text-blue-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">
                    Detalle de Ventas
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Orden
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Terminal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Método de Pago
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesReport.data.map((sale: SaleData) => (
                        <tr key={sale.orderId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {sale.orderNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.customerName || "Cliente POS"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.terminalId || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {sale.paymentMethod?.paymentMethod || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            {formatCurrency(parseFloat(sale.total ?? "0"))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(
                              new Date(sale.createdAt ?? new Date()),
                              "dd/MM/yyyy HH:mm",
                              { locale: es },
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products Report */}
          {activeTab === "products" && productsReport && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">📦</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Productos Vendidos
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {productsReport.summary.totalProducts}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">💰</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Ingresos por Productos
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(productsReport.summary.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">📊</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Unidades Vendidas
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {productsReport.summary.totalUnitsSold}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">🏷️</div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Precio Promedio
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(productsReport.summary.averagePrice)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">
                    Productos Más Vendidos
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unidades
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ingresos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Órdenes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productsReport.data.map((product: ProductSalesData) => (
                        <tr
                          key={product.productId}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(parseFloat(product.price ?? "0"))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                            {product.totalSold || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            {formatCurrency(
                              parseFloat((product as any).totalRevenue || 0),
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(product as any).orderCount || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Financial Report - Coming Soon */}
          {activeTab === "financial" && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Reportes Financieros Avanzados
              </h3>
              <p className="text-gray-600 mb-8">
                Próximamente disponible: análisis de flujo de caja, tendencias
                mensuales, comparación de períodos, y reportes personalizados.
              </p>
              <div className="text-sm text-gray-500">
                Generado: {new Date().toLocaleString("es-MX")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
