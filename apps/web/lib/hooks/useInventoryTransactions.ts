"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface InventoryTransaction {
  id: string;
  tenantId: string;
  productId: string;
  transactionType: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceId?: string;
  referenceType?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface UseInventoryTransactionsOptions {
  autoFetch?: boolean;
  productId?: string;
  transactionType?: string;
}

export function useInventoryTransactions(
  options: UseInventoryTransactionsOptions = {},
) {
  const { autoFetch = true, productId, transactionType } = options;
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInventoryTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = "/api/inventory/transactions";
      const params = new URLSearchParams();

      if (productId) params.append("productId", productId);
      if (transactionType) params.append("transactionType", transactionType);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Error al obtener transacciones de inventario");
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [productId, transactionType, toast]);

  const getInventoryTransactionById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/transactions/${id}`);

        if (!response.ok) {
          throw new Error("Error al obtener transacción de inventario");
        }

        const transaction = await response.json();
        return transaction;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // Cargar transacciones automáticamente si autoFetch es true
  if (autoFetch && transactions.length === 0 && !loading && !error) {
    fetchInventoryTransactions();
  }

  return {
    transactions,
    loading,
    error,
    fetchInventoryTransactions,
    getInventoryTransactionById,
  };
}
