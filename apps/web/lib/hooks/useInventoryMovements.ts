"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface InventoryMovement {
  id: string;
  tenantId: string;
  productId: string;
  quantity: number;
  type: "in" | "out";
  reason: string;
  notes?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateInventoryMovementData {
  productId: string;
  quantity: number;
  type: "in" | "out";
  reason: string;
  notes?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, any>;
}

export interface UseInventoryMovementsOptions {
  autoFetch?: boolean;
  productId?: string;
  type?: "in" | "out";
}

export function useInventoryMovements(
  options: UseInventoryMovementsOptions = {},
) {
  const { autoFetch = true, productId, type } = options;
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInventoryMovements = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = "/api/inventory/movements";
      const params = new URLSearchParams();

      if (productId) params.append("productId", productId);
      if (type) params.append("type", type);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Error al obtener movimientos de inventario");
      }

      const data = await response.json();
      setMovements(data);
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
  }, [productId, type, toast]);

  const createInventoryMovement = useCallback(
    async (data: CreateInventoryMovementData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/inventory/movements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al crear movimiento de inventario",
          );
        }

        const newMovement = await response.json();
        setMovements((prev) => [newMovement, ...prev]);

        toast({
          title: "Éxito",
          description: "Movimiento de inventario creado correctamente",
        });

        return newMovement;
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

  const getInventoryMovementById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/movements/${id}`);

        if (!response.ok) {
          throw new Error("Error al obtener movimiento de inventario");
        }

        const movement = await response.json();
        return movement;
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

  // Cargar movimientos automáticamente si autoFetch es true
  if (autoFetch && movements.length === 0 && !loading && !error) {
    fetchInventoryMovements();
  }

  return {
    movements,
    loading,
    error,
    fetchInventoryMovements,
    createInventoryMovement,
    getInventoryMovementById,
  };
}
