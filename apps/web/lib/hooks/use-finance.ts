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
  type: "SETTLEMENT" | "REFUND" | "CHARGEBACK" | "WITHDRAWAL" | "FEE" | "CARD_PURCHASE";
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

export const useFinance = () => {
  const params = useParams();
  const tenantSlug = params.tenant as string;

  const [data, setData] = useState<FinanceData>({
    kpis: {
      totalIncome: 0,
      totalExpenses: 0,
      netCashFlow: 0,
      averageTicket: 0,
      approvalRate: 0,
      transactionCount: 0,
      availableBalance: 0,
      incomeTrend: 0,
      expenseTrend: 0,
    },
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
      try {
        setData((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(`/api/finance/kpis?period=${period}`);
        if (!response.ok) {
          throw new Error("Failed to fetch KPIs");
        }

        const result = await response.json();

        setData((prev) => ({
          ...prev,
          kpis: result.aggregated,
          loading: false,
        }));

        return result;
      } catch (error) {
        console.error("Error fetching KPIs:", error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        return null;
      }
    },
    [tenantSlug]
  );

  const fetchMovements = useCallback(
    async (filters: MovementFilters = {}) => {
      try {
        setData((prev) => ({ ...prev, loading: true, error: null }));

        const queryParams = new URLSearchParams();

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
          throw new Error("Failed to fetch movements");
        }

        const result = await response.json();

        setData((prev) => ({
          ...prev,
          movements: result.data,
          loading: false,
        }));

        return result;
      } catch (error) {
        console.error("Error fetching movements:", error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        return null;
      }
    },
    [tenantSlug]
  );

  const updateMovementFilters = useCallback(
    (newFilters: Partial<MovementFilters>) => {
      const updatedFilters = { ...movementFilters, ...newFilters };
      setMovementFilters(updatedFilters);
      fetchMovements(updatedFilters);
    },
    [movementFilters, fetchMovements]
  );

  const resetMovementFilters = useCallback(() => {
    const defaultFilters: MovementFilters = {
      limit: 50,
      offset: 0,
      sortBy: "movementDate",
      sortOrder: "desc",
    };
    setMovementFilters(defaultFilters);
    fetchMovements(defaultFilters);
  }, [fetchMovements]);

  const connectMercadoPago = useCallback(async () => {
    try {
      const response = await fetch("/api/mercadopago/connect", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to initiate Mercado Pago connection");
      }

      const result = await response.json();

      if (result.authUrl) {
        // Redirect to Mercado Pago OAuth
        window.location.href = result.authUrl;
      }

      return result;
    } catch (error) {
      console.error("Error connecting to Mercado Pago:", error);
      throw error;
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
        const response = await fetch("/api/finance/pos/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(saleData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create POS sale");
        }

        const result = await response.json();

        // Refresh data to show new sale
        fetchMovements();
        fetchKPIs();

        return result;
      } catch (error) {
        console.error("Error creating POS sale:", error);
        throw error;
      }
    },
    [fetchMovements, fetchKPIs]
  );

  const getPOSTerminals = useCallback(async () => {
    try {
      const response = await fetch("/api/finance/pos/terminals");
      if (!response.ok) {
        throw new Error("Failed to fetch POS terminals");
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching POS terminals:", error);
      return [];
    }
  }, []);

  const generateSalesReport = useCallback(
    async (
      filters: {
        from?: string;
        to?: string;
        terminalId?: string;
        paymentMethod?: string;
        format?: "json" | "pdf" | "excel";
      } = {}
    ) => {
      try {
        const params = new URLSearchParams();
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
    []
  );

  const generateProductsReport = useCallback(
    async (
      filters: {
        from?: string;
        to?: string;
        category?: string;
        limit?: number;
        format?: "json" | "pdf" | "excel";
      } = {}
    ) => {
      try {
        const params = new URLSearchParams();
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
    []
  );

  const checkMercadoPagoStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/mercadopago/connect");
      if (!response.ok) {
        return { connected: false };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error checking Mercado Pago status:", error);
      return { connected: false };
    }
  }, []);

  const reconcileMovement = useCallback(
    async (
      movementId: string,
      reconciled: boolean,
      reconciliationId?: string
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
            }),
          }
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
              : movement
          ),
        }));

        return result;
      } catch (error) {
        console.error("Error reconciling movement:", error);
        throw error;
      }
    },
    []
  );

  // Load initial data
  useEffect(() => {
    fetchKPIs();
    fetchMovements(movementFilters); // Load movements with current filters
  }, [fetchKPIs, fetchMovements, movementFilters]);

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
