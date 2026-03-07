"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MovementsTable from "@/components/finance/MovementsTable";
import FilterPanel from "@/components/finance/FilterPanel";
import KPICard from "@/components/finance/KPICard";
import { useFinance } from "@/lib/hooks/use-finance";
import { MovementsTableSkeleton, FilterPanelSkeleton } from "@/components/finance/FinanceSkeletons";

export default function FinanceMovementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenant as string;
  
  const movementType = searchParams.get('type') || 'all';
  
  const [currentTenant, setCurrentTenant] = useState<any>(null);

  const {
    kpis,
    movements,
    movementFilters,
    loading,
    error,
    updateMovementFilters,
    resetMovementFilters,
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

    loadTenantData();
  }, [tenantSlug]);

  useEffect(() => {
    // Update filters when movement type changes
    if (movementType && movementType !== 'all') {
      updateMovementFilters({ type: movementType });
    }
  }, [movementType, updateMovementFilters]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando movimientos...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const getTitle = () => {
    switch (movementType) {
      case 'income':
        return 'Registrar Ingreso';
      case 'expense':
        return 'Registrar Gasto';
      default:
        return 'Todos los Movimientos';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {getTitle()} - {currentTenant?.name || "Negocio"}
            </h1>
            <button
              onClick={() => router.push(`/t/${tenantSlug}/finance`)}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              ← Volver al Panel Financiero
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Total Movimientos"
              value={movements.length}
              icon="📊"
              format="number"
              loading={loading}
            />
            <KPICard
              title="Ingresos"
              value={movements
                .filter(m => m.type === 'SETTLEMENT' || m.type === 'CARD_PURCHASE' || m.type === 'income')
                .reduce((sum, m) => sum + m.amount, 0)}
              icon="💰"
              format="currency"
              loading={loading}
            />
            <KPICard
              title="Gastos"
              value={movements
                .filter(m => m.type === 'REFUND' || m.type === 'CHARGEBACK' || m.type === 'FEE' || m.type === 'expense')
                .reduce((sum, m) => sum + m.amount, 0)}
              icon="💸"
              format="currency"
              loading={loading}
            />
            <KPICard
              title="Balance Neto"
              value={kpis.netCashFlow}
              icon="⚖️"
              format="currency"
              loading={loading}
            />
          </div>

          {/* Filter Panel */}
          {loading ? (
            <FilterPanelSkeleton />
          ) : (
            <FilterPanel
              filters={movementFilters}
              onFiltersChange={updateMovementFilters}
              onReset={resetMovementFilters}
              loading={loading}
            />
          )}

          {/* Movements Table */}
          {loading ? (
            <MovementsTableSkeleton />
          ) : (
            <MovementsTable
              movements={movements}
              loading={loading}
              onMovementClick={(movement) => {
                // TODO: Implement movement details modal
                console.log('Movement clicked:', movement);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}