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
import { useInventoryAlertConfig } from "@/lib/hooks";
import {
  InventoryAlertConfig,
  CreateAlertConfigData,
} from "@/lib/hooks/useInventoryAlertConfig";
import { Plus, Settings } from "lucide-react";
import { InventoryAlertConfigForm } from "./InventoryAlertConfigForm";

interface InventoryAlertConfigListProps {
  productId?: string;
  onEdit?: (config: InventoryAlertConfig) => void;
  onCreate?: () => void;
}

export function InventoryAlertConfigList({
  productId,
  onEdit,
  onCreate,
}: InventoryAlertConfigListProps) {
  const { configs, loading, error, createInventoryAlertConfig } =
    useInventoryAlertConfig({ productId });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleCreate = () => {
    setIsFormOpen(true);
    onCreate?.();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  if (loading && configs.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p>Cargando configuraciones de alertas...</p>
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
          <h2 className="text-2xl font-bold">Configuración de Alertas</h2>
          <p className="text-gray-600">
            Gestiona la configuración de alertas de inventario
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Configuración
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Configuraciones</CardTitle>
          <CardDescription>
            Todas las configuraciones de alertas de inventario registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No hay configuraciones de alertas registradas
              </p>
              <Button className="mt-4" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Configuración
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Stock Mínimo</TableHead>
                  <TableHead>Stock Máximo</TableHead>
                  <TableHead>Umbral Bajo</TableHead>
                  <TableHead>Umbral Alto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">
                      {config.productId}
                    </TableCell>
                    <TableCell>{config.minStock}</TableCell>
                    <TableCell>{config.maxStock}</TableCell>
                    <TableCell>{config.lowStockThreshold}</TableCell>
                    <TableCell>{config.highStockThreshold}</TableCell>
                    <TableCell>
                      <Badge
                        variant={config.isActive ? "default" : "secondary"}
                      >
                        {config.isActive ? "Activo" : "Inactivo"}
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
        <InventoryAlertConfigForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          productId={productId}
        />
      )}
    </div>
  );
}
