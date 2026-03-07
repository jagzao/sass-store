"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface KPIData {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  averageTicket: number;
  approvalRate: number;
  transactionCount: number;
  availableBalance: number;
  incomeTrend: number;
  expenseTrend: number;
}

interface Movement {
  id: string;
  type:
    | "SETTLEMENT"
    | "REFUND"
    | "CHARGEBACK"
    | "WITHDRAWAL"
    | "FEE"
    | "CARD_PURCHASE";
  amount: number;
  currency: string;
  description: string;
  referenceId?: string;
  paymentMethod?: string;
  counterparty?: string;
  movementDate: string;
  reconciled: boolean;
  reconciliationId?: string;
}

interface FinanceData {
  kpis: KPIData;
  movements: Movement[];
  loading: boolean;
  error: string | null;
}

const DEFAULT_KPIS: KPIData = {
  totalIncome: 0,
  totalExpenses: 0,
  netCashFlow: 0,
  averageTicket: 0,
  approvalRate: 0,
  transactionCount: 0,
  availableBalance: 0,
  incomeTrend: 0,
  expenseTrend: 0,
};

interface MovementFilters {
  type?: string;
  paymentMethod?: string;
  status?: "reconciled" | "unreconciled";
  from?: Date;
  to?: Date;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "movementDate" | "amount" | "type";
  sortOrder?: "asc" | "desc";
}

export const useFinance = (options?: { enabled?: boolean }) => {
  const enabled = options?.enabled ?? true;
  const params = useParams();
  const rawTenant = params.tenant;
  const tenantSlug =
    (Array.isArray(rawTenant) ? rawTenant[0] : rawTenant) || "";

  const [data, setData] = useState<FinanceData>({
    kpis: DEFAULT_KPIS,
    movements: [],
    loading: true,
    error: null,
  });

  const [movementFilters, setMovementFilters] = useState<MovementFilters>({
    limit: 50,
    offset: 0,
    sortBy: "movementDate",
    sortOrder: "desc",
  });

  const fetchKPIs = useCallback(
    async (period: string = "month") => {
      if (!enabled || !tenantSlug) {
        return null;
      }

      try {
        setData((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/finance/kpis?period=${period}&tenant=${tenantSlug}`,
        );
        if (!response.ok) {
          if (
            response.status === 401 ||
            response.status === 403 ||
            response.status === 404
          ) {
            setData((prev) => ({
              ...prev,
              kpis: DEFAULT_KPIS,
              loading: false,
              error: null,
            }));
            return null;
          }

          let message = "Failed to fetch KPIs";
          try {
            const errorBody = await response.json();
            if (typeof errorBody?.error === "string") {
              message = errorBody.error;
            }
          } catch {
            // Ignore JSON parse failures and keep default message
          }

          throw new Error(message);
        }

        const result = await response.json();
        const nextKpis = result?.data ?? DEFAULT_KPIS;

        setData((prev) => ({
          ...prev,
          kpis: nextKpis,
          loading: false,
        }));

        return result;
      } catch (error) {
        console.warn("Error fetching KPIs:", error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        return null;
      }
    },
    [enabled, tenantSlug],
  );

  const fetchMovements = useCallback(
    async (filters: MovementFilters = {}) => {
      if (!enabled || !tenantSlug) {
        return null;
      }

      try {
        setData((prev) => ({ ...prev, loading: true, error: null }));

        const queryParams = new URLSearchParams();

        // Agregar parámetro tenant
        queryParams.append("tenant", tenantSlug);

        // Convertir filtros a parámetros de query
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (value instanceof Date) {
              queryParams.append(key, value.toISOString());
            } else {
              queryParams.append(key, String(value));
            }
          }
        });

        const response = await fetch(`/api/finance/movements?${queryParams}`);
        if (!response.ok) {
          if (
            response.status === 401 ||
            response.status === 403 ||
            response.status === 404
          ) {
            setData((prev) => ({
              ...prev,
              movements: [],
              loading: false,
              error: null,
            }));
            return null;
          }

          let message = "Failed to fetch movements";
          try {
            const errorBody = await response.json();
            if (typeof errorBody?.error === "string") {
              message = errorBody.error;
            }
          } catch {
            // Ignore JSON parse failures and keep default message
          }

          throw new Error(message);
        }

        const result = await response.json();
        const nextMovements = Array.isArray(result?.data) ? result.data : [];

        setData((prev) => ({
          ...prev,
          movements: nextMovements,
          loading: false,
        }));

        return result;
      } catch (error) {
        console.warn("Error fetching movements:", error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        return null;
      }
    },
    [enabled, tenantSlug],
  );

  const updateMovementFilters = useCallback(
    (newFilters: Partial<MovementFilters>) => {
      setMovementFilters((prev) => ({ ...prev, ...newFilters }));
    },
    [],
  );

  const resetMovementFilters = useCallback(() => {
    const defaultFilters: MovementFilters = {
      limit: 50,
      offset: 0,
      sortBy: "movementDate",
      sortOrder: "desc",
    };
    setMovementFilters(defaultFilters);
  }, []);

  const connectMercadoPago = useCallback(async () => {
    try {
      const response = await fetch("/api/mercadopago/connect", {
        method: "POST",
      });

      if (!response.ok) {
        return { connected: false };
      }

      const result = await response.json();

      if (result.authUrl) {
        // Redirect to Mercado Pago OAuth
        window.location.href = result.authUrl;
      }

      return result;
    } catch (error) {
      console.error("Error connecting to Mercado Pago:", error);
      return { connected: false };
    }
  }, []);

  const createPOSSale = useCallback(
    async (saleData: {
      terminalId: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
      }>;
      customerName?: string;
      customerEmail?: string;
      paymentMethod: "cash" | "card" | "mercadopago";
      notes?: string;
    }) => {
      try {
        // Agregar tenantSlug a los datos de la venta
        const saleDataWithTenant = {
          ...saleData,
          tenantSlug,
          customerId: null, // Por ahora, podemos mejorar esto después
          totalAmount: saleData.items.reduce(
            (total, item) => total + item.quantity * item.unitPrice,
            0,
          ),
        };

        const response = await fetch("/api/finance/pos/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(saleDataWithTenant),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create POS sale");
        }

        const result = await response.json();

        // Refresh data to show new sale
        // fetchMovements(); // Handled by filter change or manual refresh if needed
        // fetchKPIs(); // This we might want to trigger manually or optimize

        // We'll trigger a refresh by updating the timestamp or just validting
        // For now let's just re-fetch manually
        fetchMovements(movementFilters);
        fetchKPIs();

        return result;
      } catch (error) {
        console.error("Error creating POS sale:", error);
        throw error;
      }
    },
    [fetchMovements, fetchKPIs, tenantSlug, movementFilters],
  );

  const getPOSTerminals = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/finance/pos/terminals?tenant=${tenantSlug}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch POS terminals");
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching POS terminals:", error);
      return [];
    }
  }, [tenantSlug]);

  const generateSalesReport = useCallback(
    async (
      filters: {
        from?: string;
        to?: string;
        terminalId?: string;
        paymentMethod?: string;
        format?: "json" | "pdf" | "excel";
      } = {},
    ) => {
      try {
        const params = new URLSearchParams();
        params.append("tenant", tenantSlug);
        if (filters.from) params.append("from", filters.from);
        if (filters.to) params.append("to", filters.to);
        if (filters.terminalId) params.append("terminalId", filters.terminalId);
        if (filters.paymentMethod)
          params.append("paymentMethod", filters.paymentMethod);
        if (filters.format) params.append("format", filters.format || "json");

        const response = await fetch(`/api/finance/reports/sales?${params}`);
        if (!response.ok) {
          throw new Error("Failed to generate sales report");
        }

        return await response.json();
      } catch (error) {
        console.error("Error generating sales report:", error);
        throw error;
      }
    },
    [tenantSlug],
  );

  const generateProductsReport = useCallback(
    async (
      filters: {
        from?: string;
        to?: string;
        category?: string;
        limit?: number;
        format?: "json" | "pdf" | "excel";
      } = {},
    ) => {
      try {
        const params = new URLSearchParams();
        params.append("tenant", tenantSlug);
        if (filters.from) params.append("from", filters.from);
        if (filters.to) params.append("to", filters.to);
        if (filters.category) params.append("category", filters.category);
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.format) params.append("format", filters.format || "json");

        const response = await fetch(`/api/finance/reports/products?${params}`);
        if (!response.ok) {
          throw new Error("Failed to generate products report");
        }

        return await response.json();
      } catch (error) {
        console.error("Error generating products report:", error);
        throw error;
      }
    },
    [tenantSlug],
  );

  const checkMercadoPagoStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/mercadopago/connect");
      if (!response.ok) {
        return { connected: false };
      }

      const result = await response.json();
      return result || { connected: false };
    } catch (error) {
      console.error("Error checking Mercado Pago status:", error);
      return { connected: false };
    }
  }, []);

  const reconcileMovement = useCallback(
    async (
      movementId: string,
      reconciled: boolean,
      reconciliationId?: string,
    ) => {
      try {
        const response = await fetch(
          `/api/finance/movements/${movementId}/reconcile`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reconciled,
              reconciliationId,
              tenantSlug,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to reconcile movement");
        }

        const result = await response.json();

        // Update local state
        setData((prev) => ({
          ...prev,
          movements: prev.movements.map((movement) =>
            movement.id === movementId
              ? { ...movement, reconciled, reconciliationId }
              : movement,
          ),
        }));

        return result;
      } catch (error) {
        console.error("Error reconciling movement:", error);
        throw error;
      }
    },
    [tenantSlug],
  );

  // Load initial KPIs
  useEffect(() => {
    if (!enabled || !tenantSlug) {
      return;
    }
    fetchKPIs();
  }, [enabled, tenantSlug, fetchKPIs]);

  // Load movements when filters change
  useEffect(() => {
    if (!enabled || !tenantSlug) {
      setData((prev) => ({ ...prev, loading: false }));
      return;
    }

    fetchMovements(movementFilters);
  }, [enabled, tenantSlug, fetchMovements, movementFilters]);

  return {
    ...data,
    movementFilters,
    fetchKPIs,
    fetchMovements,
    updateMovementFilters,
    resetMovementFilters,
    reconcileMovement,
    createPOSSale,
    getPOSTerminals,
    generateSalesReport,
    generateProductsReport,
    connectMercadoPago,
    checkMercadoPagoStatus,
  };
};
