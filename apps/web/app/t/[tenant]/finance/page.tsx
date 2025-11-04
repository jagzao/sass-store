"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";
import KPICard from "@/components/finance/KPICard";
import FilterPanel from "@/components/finance/FilterPanel";
import MovementsTable from "@/components/finance/MovementsTable";
import ReconciliationModal from "@/components/finance/ReconciliationModal";
import { useFinance } from "@/lib/hooks/use-finance";

export default function TenantFinancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [mercadoPagoStatus, setMercadoPagoStatus] = useState<{
    connected: boolean;
  } | null>(null);
  const [reconciliationModal, setReconciliationModal] = useState<{
    isOpen: boolean;
    movement: any;
  }>({
    isOpen: false,
    movement: null,
  });

  const {
    kpis,
    movements,
    movementFilters,
    loading,
    error,
    updateMovementFilters,
    resetMovementFilters,
    reconcileMovement,
    connectMercadoPago,
    checkMercadoPagoStatus,
  } = useFinance();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/t/${tenantSlug}/login`);
    }
  }, [status, router, tenantSlug]);

  useEffect(() => {
    // Load tenant data
    const loadTenantData = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenantSlug}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentTenant(data);
        }
      } catch (error) {
        console.error("Error loading tenant:", error);
      }
    };

    // Check Mercado Pago connection status
    const loadMercadoPagoStatus = async () => {
      const status = await checkMercadoPagoStatus();
      setMercadoPagoStatus(status);
    };

    loadTenantData();
    loadMercadoPagoStatus();
  }, [tenantSlug, checkMercadoPagoStatus]);

  const handleMovementClick = (movement: any) => {
    setReconciliationModal({
      isOpen: true,
      movement,
    });
  };

  const handleReconcileMovement = async (
    movementId: string,
    reconciled: boolean,
    reconciliationId?: string
  ) => {
    await reconcileMovement(movementId, reconciled, reconciliationId);
  };

  const closeReconciliationModal = () => {
    setReconciliationModal({
      isOpen: false,
      movement: null,
    });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando finanzas...</p>
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
                Panel Financiero - {currentTenant?.name || "Negocio"}
              </h1>
            </div>
            <UserMenu tenantSlug={tenantSlug} />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Mercado Pago Connection Status */}
          {mercadoPagoStatus && !mercadoPagoStatus.connected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-yellow-600 mr-3">⚠️</div>
                  <div>
                    <h3 className="font-semibold text-yellow-800">
                      Conectar Mercado Pago
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Para ver datos financieros reales, conecta tu cuenta de
                      Mercado Pago
                    </p>
                  </div>
                </div>
                <button
                  onClick={connectMercadoPago}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Conectar
                </button>
              </div>
            </div>
          )}

          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Ingresos Totales"
              value={kpis.totalIncome}
              change={kpis.incomeTrend}
              icon="💰"
              trend={
                kpis.incomeTrend > 0
                  ? "up"
                  : kpis.incomeTrend < 0
                    ? "down"
                    : "neutral"
              }
              format="currency"
              loading={loading}
            />

            <KPICard
              title="Transacciones"
              value={kpis.transactionCount}
              icon="📦"
              format="number"
              loading={loading}
            />

            <KPICard
              title="Ticket Promedio"
              value={kpis.averageTicket}
              icon="🏷️"
              format="currency"
              loading={loading}
            />

            <KPICard
              title="Tasa de Aprobación"
              value={kpis.approvalRate}
              icon="✅"
              format="percentage"
              loading={loading}
            />
          </div>

          {/* Additional KPIs Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <KPICard
              title="Saldo Disponible"
              value={kpis.availableBalance}
              icon="🏦"
              format="currency"
              loading={loading}
            />

            <KPICard
              title="Flujo de Caja Neto"
              value={kpis.netCashFlow}
              change={kpis.netCashFlow > 0 ? 5 : -5}
              icon="📊"
              trend={kpis.netCashFlow > 0 ? "up" : "down"}
              format="currency"
              loading={loading}
            />

            <KPICard
              title="Gastos Totales"
              value={kpis.totalExpenses}
              change={kpis.expenseTrend}
              icon="💸"
              trend={kpis.expenseTrend > 0 ? "down" : "up"}
              format="currency"
              loading={loading}
            />
          </div>

          {/* Charts and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Ingresos por Mes
              </h2>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-600">
                    Gráfico de ingresos (Próximamente)
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Enero</span>
                      <span className="text-sm font-semibold">$8,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Febrero</span>
                      <span className="text-sm font-semibold">$9,100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Marzo</span>
                      <span className="text-sm font-semibold">$10,800</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Abril</span>
                      <span className="text-sm font-semibold">$12,450</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Transacciones Recientes
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">
                      Servicio Premium
                    </p>
                    <p className="text-sm text-gray-600">
                      Cliente: María García
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+$450</p>
                    <p className="text-xs text-gray-500">Hoy 14:30</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Tratamiento Spa</p>
                    <p className="text-sm text-gray-600">Cliente: Ana López</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+$550</p>
                    <p className="text-xs text-gray-500">Ayer 16:45</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">
                      Servicio Especializado
                    </p>
                    <p className="text-sm text-gray-600">
                      Cliente: Carmen Ruiz
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+$200</p>
                    <p className="text-xs text-gray-500">2 días atrás</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      Tratamiento Premium
                    </p>
                    <p className="text-sm text-gray-600">
                      Cliente: Laura Martín
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+$320</p>
                    <p className="text-xs text-gray-500">3 días atrás</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Reports */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              Reportes Financieros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center mb-2">
                  <div className="text-2xl mr-3">📄</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Balance General
                    </h3>
                    <p className="text-sm text-gray-600">
                      Estado financiero completo
                    </p>
                  </div>
                </div>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center mb-2">
                  <div className="text-2xl mr-3">💰</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Flujo de Caja
                    </h3>
                    <p className="text-sm text-gray-600">
                      Movimientos de efectivo
                    </p>
                  </div>
                </div>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center mb-2">
                  <div className="text-2xl mr-3">📊</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Análisis de Costos
                    </h3>
                    <p className="text-sm text-gray-600">
                      Rentabilidad por servicio
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Movements Section */}
          <div className="mt-8">
            <FilterPanel
              filters={movementFilters}
              onFiltersChange={updateMovementFilters}
              onReset={resetMovementFilters}
              loading={loading}
            />

            <MovementsTable
              movements={movements}
              loading={loading}
              onMovementClick={handleMovementClick}
            />
          </div>
        </div>
      </div>

      {/* Reconciliation Modal */}
      <ReconciliationModal
        movement={reconciliationModal.movement}
        isOpen={reconciliationModal.isOpen}
        onClose={closeReconciliationModal}
        onReconcile={handleReconcileMovement}
        loading={loading}
      />
    </div>
  );
}
