"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface InventoryLocation {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  type: "warehouse" | "store" | "office" | "other";
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager?: string;
  capacity?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateInventoryLocationData {
  name: string;
  code: string;
  type: "warehouse" | "store" | "office" | "other";
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager?: string;
  capacity?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateInventoryLocationData {
  name?: string;
  code?: string;
  type?: "warehouse" | "store" | "office" | "other";
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager?: string;
  capacity?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface UseInventoryLocationsOptions {
  autoFetch?: boolean;
  type?: "warehouse" | "store" | "office" | "other";
  isActive?: boolean;
}

export function useInventoryLocations(
  options: UseInventoryLocationsOptions = {},
) {
  const { autoFetch = true, type, isActive } = options;
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInventoryLocations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = "/api/inventory/locations";
      const params = new URLSearchParams();

      if (type) params.append("type", type);
      if (isActive !== undefined)
        params.append("isActive", isActive.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Error al obtener ubicaciones de inventario");
      }

      const data = await response.json();
      setLocations(data);
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
  }, [type, isActive, toast]);

  const createInventoryLocation = useCallback(
    async (data: CreateInventoryLocationData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/inventory/locations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al crear ubicación de inventario",
          );
        }

        const newLocation = await response.json();
        setLocations((prev) => [...prev, newLocation]);

        toast({
          title: "Éxito",
          description: "Ubicación de inventario creada correctamente",
        });

        return newLocation;
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

  const updateInventoryLocation = useCallback(
    async (id: string, data: UpdateInventoryLocationData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/locations/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al actualizar ubicación de inventario",
          );
        }

        const updatedLocation = await response.json();
        setLocations((prev) =>
          prev.map((location) =>
            location.id === id ? updatedLocation : location,
          ),
        );

        toast({
          title: "Éxito",
          description: "Ubicación de inventario actualizada correctamente",
        });

        return updatedLocation;
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

  const deleteInventoryLocation = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/locations/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al eliminar ubicación de inventario",
          );
        }

        setLocations((prev) => prev.filter((location) => location.id !== id));

        toast({
          title: "Éxito",
          description: "Ubicación de inventario eliminada correctamente",
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

  const getInventoryLocationById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/locations/${id}`);

        if (!response.ok) {
          throw new Error("Error al obtener ubicación de inventario");
        }

        const location = await response.json();
        return location;
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

  // Cargar ubicaciones automáticamente si autoFetch es true
  if (autoFetch && locations.length === 0 && !loading && !error) {
    fetchInventoryLocations();
  }

  return {
    locations,
    loading,
    error,
    fetchInventoryLocations,
    createInventoryLocation,
    updateInventoryLocation,
    deleteInventoryLocation,
    getInventoryLocationById,
  };
}
