"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateSupplierData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  metadata?: Record<string, any>;
}

export interface UpdateSupplierData {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  metadata?: Record<string, any>;
}

export interface UseSuppliersOptions {
  autoFetch?: boolean;
}

export function useSuppliers(options: UseSuppliersOptions = {}) {
  const { autoFetch = true } = options;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/inventory/suppliers");

      if (!response.ok) {
        throw new Error("Error al obtener proveedores");
      }

      const data = await response.json();
      setSuppliers(data);
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
  }, [toast]);

  const createSupplier = useCallback(
    async (data: CreateSupplierData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/inventory/suppliers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al crear proveedor");
        }

        const newSupplier = await response.json();
        setSuppliers((prev) => [...prev, newSupplier]);

        toast({
          title: "Éxito",
          description: "Proveedor creado correctamente",
        });

        return newSupplier;
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

  const updateSupplier = useCallback(
    async (id: string, data: UpdateSupplierData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/suppliers/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al actualizar proveedor");
        }

        const updatedSupplier = await response.json();
        setSuppliers((prev) =>
          prev.map((supplier) =>
            supplier.id === id ? updatedSupplier : supplier,
          ),
        );

        toast({
          title: "Éxito",
          description: "Proveedor actualizado correctamente",
        });

        return updatedSupplier;
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

  const deleteSupplier = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/suppliers/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al eliminar proveedor");
        }

        setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id));

        toast({
          title: "Éxito",
          description: "Proveedor eliminado correctamente",
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

  // Cargar proveedores automáticamente si autoFetch es true
  if (autoFetch && suppliers.length === 0 && !loading && !error) {
    fetchSuppliers();
  }

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}
