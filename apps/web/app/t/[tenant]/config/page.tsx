"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";
import FormSelect from "@/components/ui/forms/FormSelect";

interface ConfigItem {
  value: any;
  description?: string;
  updatedAt: string;
}

interface ConfigData {
  [category: string]: {
    [key: string]: ConfigItem;
  };
}

export default function ConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenant as string;

  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [config, setConfig] = useState<ConfigData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] =
    useState<string>("payment_methods");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/t/${tenantSlug}/login`);
    }
  }, [status, router, tenantSlug]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tenant info
        const tenantResponse = await fetch(`/api/tenants/${tenantSlug}`);
        if (tenantResponse.ok) {
          const tenantData = await tenantResponse.json();
          setCurrentTenant(tenantData);
        }

        // Load configuration
        await loadConfig();
      } catch (error) {
        console.error("Error loading config:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      loadData();
    }
  }, [session, tenantSlug]);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/finance/config");
      if (response.ok) {
        const configData = await response.json();
        setConfig(configData.data || {});
      }
    } catch (error) {
      console.error("Error loading config:", error);
    }
  };

  const updateConfig = async (
    category: string,
    key: string,
    value: any,
    description?: string,
  ) => {
    setSaving(true);
    try {
      const response = await fetch("/api/finance/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          key,
          value,
          description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update config");
      }

      const result = await response.json();

      // Update local state
      setConfig((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: {
            value,
            description,
            updatedAt: new Date().toISOString(),
          },
        },
      }));

      alert("Configuración actualizada exitosamente");
    } catch (error) {
      console.error("Error updating config:", error);
      alert("Error al actualizar configuración: " + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    {
      id: "payment_methods",
      name: "💳 Métodos de Pago",
      description: "Configurar métodos de pago disponibles",
      settings: [
        {
          key: "mercadopago_enabled",
          label: "Mercado Pago",
          type: "boolean",
          description: "Habilitar pagos con Mercado Pago",
          default: true,
        },
        {
          key: "cash_enabled",
          label: "Efectivo",
          type: "boolean",
          description: "Permitir pagos en efectivo",
          default: true,
        },
        {
          key: "card_enabled",
          label: "Tarjeta",
          type: "boolean",
          description: "Permitir pagos con tarjeta",
          default: true,
        },
      ],
    },
    {
      id: "pos_settings",
      name: "🛒 Configuración POS",
      description: "Ajustes del punto de venta",
      settings: [
        {
          key: "auto_print_receipt",
          label: "Imprimir recibo automáticamente",
          type: "boolean",
          description: "Imprimir recibo después de cada venta",
          default: true,
        },
        {
          key: "require_customer_info",
          label: "Requerir información del cliente",
          type: "boolean",
          description: "Pedir nombre y email en cada venta",
          default: false,
        },
        {
          key: "default_payment_method",
          label: "Método de pago por defecto",
          type: "select",
          options: [
            { value: "cash", label: "Efectivo" },
            { value: "card", label: "Tarjeta" },
            { value: "mercadopago", label: "Mercado Pago" },
          ],
          description: "Método de pago seleccionado por defecto",
          default: "cash",
        },
      ],
    },
    {
      id: "notifications",
      name: "📧 Notificaciones",
      description: "Configurar alertas y notificaciones",
      settings: [
        {
          key: "email_sales_summary",
          label: "Resumen diario de ventas",
          type: "boolean",
          description: "Enviar resumen diario por email",
          default: true,
        },
        {
          key: "low_stock_alerts",
          label: "Alertas de stock bajo",
          type: "boolean",
          description: "Notificar cuando productos estén bajos en stock",
          default: true,
        },
        {
          key: "payment_failures",
          label: "Fallos de pago",
          type: "boolean",
          description: "Alertar sobre transacciones fallidas",
          default: true,
        },
      ],
    },
    {
      id: "reports",
      name: "📊 Reportes",
      description: "Configuración de reportes automáticos",
      settings: [
        {
          key: "auto_generate_reports",
          label: "Generar reportes automáticamente",
          type: "boolean",
          description: "Crear reportes diarios/semanalmente",
          default: true,
        },
        {
          key: "report_frequency",
          label: "Frecuencia de reportes",
          type: "select",
          options: [
            { value: "daily", label: "Diario" },
            { value: "weekly", label: "Semanal" },
            { value: "monthly", label: "Mensual" },
          ],
          description: "Con qué frecuencia generar reportes",
          default: "weekly",
        },
      ],
    },
    {
      id: "business_rules",
      name: "⚖️ Reglas de Negocio",
      description: "Políticas y reglas comerciales",
      settings: [
        {
          key: "tax_rate",
          label: "Tasa de IVA (%)",
          type: "number",
          description: "Tasa de impuesto al valor agregado",
          default: 16,
          min: 0,
          max: 100,
        },
        {
          key: "min_order_amount",
          label: "Monto mínimo de pedido",
          type: "number",
          description: "Monto mínimo para procesar pedidos",
          default: 0,
          min: 0,
        },
        {
          key: "max_discount_percentage",
          label: "Máximo descuento (%)",
          type: "number",
          description: "Porcentaje máximo de descuento permitido",
          default: 50,
          min: 0,
          max: 100,
        },
      ],
    },
  ];

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">Cargando configuración...</p>
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
                ⚙️ Configuración - {currentTenant?.name || "Negocio"}
              </h1>
            </div>
            <UserMenu tenantSlug={tenantSlug} />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-900">
                  Categorías
                </h2>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        activeCategory === category.id
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {category.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-6">
                {(() => {
                  const category = categories.find(
                    (c) => c.id === activeCategory,
                  );
                  if (!category) return null;

                  return (
                    <>
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {category.name}
                        </h2>
                        <p className="text-gray-600">{category.description}</p>
                      </div>

                      <div className="space-y-6">
                        {category.settings.map((setting) => {
                          const currentValue =
                            config[category.id]?.[setting.key]?.value ??
                            setting.default;

                          return (
                            <div
                              key={setting.key}
                              className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-900 mb-1">
                                    {setting.label}
                                  </label>
                                  <p className="text-sm text-gray-600">
                                    {setting.description}
                                  </p>
                                </div>

                                <div className="ml-6">
                                  {setting.type === "boolean" && (
                                    <label className="inline-flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={currentValue}
                                        onChange={(e) =>
                                          updateConfig(
                                            category.id,
                                            setting.key,
                                            e.target.checked,
                                            setting.description,
                                          )
                                        }
                                        disabled={saving}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                    </label>
                                  )}

                                  {setting.type === "select" && (
                                    <FormSelect
                                      value={currentValue}
                                      onChange={(e) =>
                                        updateConfig(
                                          category.id,
                                          setting.key,
                                          e.target.value,
                                          setting.description,
                                        )
                                      }
                                      disabled={saving}
                                      selectClassName="w-48 text-sm"
                                      options={setting.options || []}
                                    />
                                  )}

                                  {setting.type === "number" && (
                                    <input
                                      type="number"
                                      value={currentValue}
                                      onChange={(e) =>
                                        updateConfig(
                                          category.id,
                                          setting.key,
                                          parseFloat(e.target.value),
                                          setting.description,
                                        )
                                      }
                                      disabled={saving}
                                      min={setting.min}
                                      max={setting.max}
                                      className="block w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  )}
                                </div>
                              </div>

                              {config[category.id]?.[setting.key] && (
                                <div className="mt-2 text-xs text-gray-500">
                                  Última actualización:{" "}
                                  {new Date(
                                    config[category.id][setting.key].updatedAt,
                                  ).toLocaleString("es-MX")}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
