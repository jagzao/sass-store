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
import { useInventoryMovements } from "@/lib/hooks";
import { CreateInventoryMovementData } from "@/lib/hooks/useInventoryMovements";

interface InventoryMovementFormProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}

export function InventoryMovementForm({
  isOpen,
  onClose,
  productId,
}: InventoryMovementFormProps) {
  const { createInventoryMovement, loading } = useInventoryMovements();
  const [formData, setFormData] = useState<CreateInventoryMovementData>({
    productId: productId || "",
    quantity: 1,
    type: "in",
    reason: "",
    notes: "",
    referenceId: "",
    referenceType: "",
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

  const handleTypeChange = (value: "in" | "out") => {
    setFormData((prev) => ({
      ...prev,
      type: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createInventoryMovement(formData);
      onClose();
    } catch (error) {
      console.error("Error al crear movimiento de inventario:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Movimiento de Inventario</DialogTitle>
          <DialogDescription>
            Registra una entrada o salida de inventario
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
              <Label htmlFor="type" className="text-right">
                Tipo *
              </Label>
              <Select
                value={formData.type}
                onValueChange={handleTypeChange}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada</SelectItem>
                  <SelectItem value="out">Salida</SelectItem>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="referenceId" className="text-right">
                Referencia ID
              </Label>
              <Input
                id="referenceId"
                name="referenceId"
                value={formData.referenceId}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="referenceType" className="text-right">
                Tipo de Referencia
              </Label>
              <Input
                id="referenceType"
                name="referenceType"
                value={formData.referenceType}
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
