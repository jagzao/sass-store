"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface InventoryTransfer {
  id: string;
  tenantId: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  reason: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateInventoryTransferData {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  reason: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateInventoryTransferData {
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UseInventoryTransfersOptions {
  autoFetch?: boolean;
  productId?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
}

export function useInventoryTransfers(
  options: UseInventoryTransfersOptions = {},
) {
  const { autoFetch = true, productId, status } = options;
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInventoryTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = "/api/inventory/transfers";
      const params = new URLSearchParams();

      if (productId) params.append("productId", productId);
      if (status) params.append("status", status);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Error al obtener transferencias de inventario");
      }

      const data = await response.json();
      setTransfers(data);
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
  }, [productId, status, toast]);

  const createInventoryTransfer = useCallback(
    async (data: CreateInventoryTransferData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/inventory/transfers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al crear transferencia de inventario",
          );
        }

        const newTransfer = await response.json();
        setTransfers((prev) => [newTransfer, ...prev]);

        toast({
          title: "Éxito",
          description: "Transferencia de inventario creada correctamente",
        });

        return newTransfer;
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

  const updateInventoryTransfer = useCallback(
    async (id: string, data: UpdateInventoryTransferData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/transfers/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              "Error al actualizar transferencia de inventario",
          );
        }

        const updatedTransfer = await response.json();
        setTransfers((prev) =>
          prev.map((transfer) =>
            transfer.id === id ? updatedTransfer : transfer,
          ),
        );

        toast({
          title: "Éxito",
          description: "Transferencia de inventario actualizada correctamente",
        });

        return updatedTransfer;
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

  const deleteInventoryTransfer = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/transfers/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al eliminar transferencia de inventario",
          );
        }

        setTransfers((prev) => prev.filter((transfer) => transfer.id !== id));

        toast({
          title: "Éxito",
          description: "Transferencia de inventario eliminada correctamente",
        });
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

  const getInventoryTransferById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/transfers/${id}`);

        if (!response.ok) {
          throw new Error("Error al obtener transferencia de inventario");
        }

        const transfer = await response.json();
        return transfer;
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

  // Cargar transferencias automáticamente si autoFetch es true
  if (autoFetch && transfers.length === 0 && !loading && !error) {
    fetchInventoryTransfers();
  }

  return {
    transfers,
    loading,
    error,
    fetchInventoryTransfers,
    createInventoryTransfer,
    updateInventoryTransfer,
    deleteInventoryTransfer,
    getInventoryTransferById,
  };
}
