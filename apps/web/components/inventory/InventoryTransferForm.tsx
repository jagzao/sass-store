"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInventoryTransfers, useInventoryLocations } from "@/lib/hooks";
import { CreateInventoryTransferData } from "@/lib/hooks/useInventoryTransfers";

interface InventoryTransferFormProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}

export function InventoryTransferForm({
  isOpen,
  onClose,
  productId,
}: InventoryTransferFormProps) {
  const { createInventoryTransfer, loading } = useInventoryTransfers();
  const { locations } = useInventoryLocations();
  const [formData, setFormData] = useState<CreateInventoryTransferData>({
    productId: productId || "",
    fromLocationId: "",
    toLocationId: "",
    quantity: 1,
    reason: "",
    notes: "",
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value) || 0 : value,
    }));
  };

  const handleFromLocationChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      fromLocationId: value,
    }));
  };

  const handleToLocationChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      toLocationId: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createInventoryTransfer(formData);
      onClose();
    } catch (error) {
      console.error("Error al crear transferencia de inventario:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Transferencia de Inventario</DialogTitle>
          <DialogDescription>
            Registra una transferencia de inventario entre ubicaciones
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
              <Label htmlFor="fromLocationId" className="text-right">
                Origen *
              </Label>
              <Select
                value={formData.fromLocationId}
                onValueChange={handleFromLocationChange}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona ubicación de origen" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="toLocationId" className="text-right">
                Destino *
              </Label>
              <Select
                value={formData.toLocationId}
                onValueChange={handleToLocationChange}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona ubicación de destino" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Cantidad *
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Razón *
              </Label>
              <Textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notas
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
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
