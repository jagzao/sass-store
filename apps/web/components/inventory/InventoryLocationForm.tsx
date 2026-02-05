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
import { useInventoryLocations } from "@/lib/hooks";
import {
  InventoryLocation,
  CreateInventoryLocationData,
} from "@/lib/hooks/useInventoryLocations";

interface InventoryLocationFormProps {
  location?: InventoryLocation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InventoryLocationForm({
  location,
  isOpen,
  onClose,
}: InventoryLocationFormProps) {
  const { createInventoryLocation, updateInventoryLocation, loading } =
    useInventoryLocations();
  const [formData, setFormData] = useState<CreateInventoryLocationData>({
    name: "",
    code: "",
    type: "warehouse",
    address: "",
    city: "",
    state: "",
    country: "",
    phone: "",
    email: "",
    manager: "",
    capacity: 0,
    isActive: true,
    metadata: {},
  });

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        code: location.code,
        type: location.type,
        address: location.address || "",
        city: location.city || "",
        state: location.state || "",
        country: location.country || "",
        phone: location.phone || "",
        email: location.email || "",
        manager: location.manager || "",
        capacity: location.capacity || 0,
        isActive: location.isActive,
        metadata: location.metadata || {},
      });
    } else {
      setFormData({
        name: "",
        code: "",
        type: "warehouse",
        address: "",
        city: "",
        state: "",
        country: "",
        phone: "",
        email: "",
        manager: "",
        capacity: 0,
        isActive: true,
        metadata: {},
      });
    }
  }, [location]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? parseInt(value) || 0 : value,
    }));
  };

  const handleTypeChange = (
    value: "warehouse" | "store" | "office" | "other",
  ) => {
    setFormData((prev) => ({
      ...prev,
      type: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (location) {
        await updateInventoryLocation(location.id, formData);
      } else {
        await createInventoryLocation(formData);
      }
      onClose();
    } catch (error) {
      console.error("Error al guardar ubicación de inventario:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {location ? "Editar Ubicación" : "Nueva Ubicación"}
          </DialogTitle>
          <DialogDescription>
            {location
              ? "Actualiza la información de la ubicación."
              : "Agrega una nueva ubicación al sistema."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Código *
              </Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="col-span-3"
                required
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
                  <SelectItem value="warehouse">Almacén</SelectItem>
                  <SelectItem value="store">Tienda</SelectItem>
                  <SelectItem value="office">Oficina</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Dirección
              </Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                Ciudad
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacidad
              </Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="0"
                value={formData.capacity}
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
              {loading ? "Guardando..." : location ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
