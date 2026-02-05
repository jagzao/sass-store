"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useInventoryLocations } from "@/lib/hooks";
import {
  InventoryLocation,
  CreateInventoryLocationData,
} from "@/lib/hooks/useInventoryLocations";
import { Plus, MapPin, Building, Store, Home } from "lucide-react";
import { InventoryLocationForm } from "./InventoryLocationForm";

interface InventoryLocationsListProps {
  onEdit?: (location: InventoryLocation) => void;
  onCreate?: () => void;
}

export function InventoryLocationsList({
  onEdit,
  onCreate,
}: InventoryLocationsListProps) {
  const { locations, loading, error, createInventoryLocation } =
    useInventoryLocations();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleCreate = () => {
    setIsFormOpen(true);
    onCreate?.();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warehouse":
        return <Building className="h-4 w-4" />;
      case "store":
        return <Store className="h-4 w-4" />;
      case "office":
        return <Home className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "warehouse":
        return "Almacén";
      case "store":
        return "Tienda";
      case "office":
        return "Oficina";
      default:
        return "Otro";
    }
  };

  if (loading && locations.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p>Cargando ubicaciones de inventario...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ubicaciones de Inventario</h2>
          <p className="text-gray-600">
            Gestiona las ubicaciones de tu inventario
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Ubicación
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Ubicaciones</CardTitle>
          <CardDescription>
            Todas las ubicaciones de inventario registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No hay ubicaciones de inventario registradas
              </p>
              <Button className="mt-4" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Ubicación
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">
                      {location.name}
                    </TableCell>
                    <TableCell>{location.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getTypeIcon(location.type)}
                        <span className="ml-2">
                          {getTypeText(location.type)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{location.city || "-"}</TableCell>
                    <TableCell>{location.capacity || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={location.isActive ? "default" : "secondary"}
                      >
                        {location.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <InventoryLocationForm isOpen={isFormOpen} onClose={handleCloseForm} />
      )}
    </div>
  );
}
