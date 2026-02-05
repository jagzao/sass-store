"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInventoryAlertConfig } from "@/lib/hooks";
import { CreateAlertConfigData } from "@/lib/hooks/useInventoryAlertConfig";

interface InventoryAlertConfigFormProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}

export function InventoryAlertConfigForm({
  isOpen,
  onClose,
  productId,
}: InventoryAlertConfigFormProps) {
  const { createInventoryAlertConfig, loading } = useInventoryAlertConfig();
  const [formData, setFormData] = useState<CreateAlertConfigData>({
    productId: productId || "",
    minStock: 0,
    maxStock: 100,
    lowStockThreshold: 10,
    highStockThreshold: 90,
    expirationDays: 30,
    isActive: true,
    metadata: {},
  });

  useEffect(() => {
    if (productId) {
      setFormData((prev) => ({
        ...prev,
        productId,
      }));
    }
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("Stock") ||
        name.includes("Days") ||
        name.includes("Threshold")
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createInventoryAlertConfig(formData);
      onClose();
    } catch (error) {
      console.error("Error al crear configuración de alerta:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Configuración de Alerta</DialogTitle>
          <DialogDescription>
            Configura las alertas de inventario para un producto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productId" className="text-right">
                Producto *
              </Label>
              <Input
                id="productId"
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                className="col-span-3"
                required
                disabled={!!productId}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minStock" className="text-right">
                Stock Mínimo *
              </Label>
              <Input
                id="minStock"
                name="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxStock" className="text-right">
                Stock Máximo *
              </Label>
              <Input
                id="maxStock"
                name="maxStock"
                type="number"
                min="0"
                value={formData.maxStock}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lowStockThreshold" className="text-right">
                Umbral Bajo *
              </Label>
              <Input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="highStockThreshold" className="text-right">
                Umbral Alto *
              </Label>
              <Input
                id="highStockThreshold"
                name="highStockThreshold"
                type="number"
                min="0"
                value={formData.highStockThreshold}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expirationDays" className="text-right">
                Días de Expiración
              </Label>
              <Input
                id="expirationDays"
                name="expirationDays"
                type="number"
                min="0"
                value={formData.expirationDays}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
