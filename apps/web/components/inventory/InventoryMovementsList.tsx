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
import { useInventoryMovements } from "@/lib/hooks";
import {
  InventoryMovement,
  CreateInventoryMovementData,
} from "@/lib/hooks/useInventoryMovements";
import { Plus, Package, Info } from "lucide-react";
import { InventoryMovementForm } from "./InventoryMovementForm";

interface InventoryMovementsListProps {
  productId?: string;
  onEdit?: (movement: InventoryMovement) => void;
  onCreate?: () => void;
}

export function InventoryMovementsList({
  productId,
  onEdit,
  onCreate,
}: InventoryMovementsListProps) {
  const { movements, loading, error, createInventoryMovement } =
    useInventoryMovements({ productId });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleCreate = () => {
    setIsFormOpen(true);
    onCreate?.();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && movements.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p>Cargando movimientos de inventario...</p>
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
          <h2 className="text-2xl font-bold">Movimientos de Inventario</h2>
          <p className="text-gray-600">Historial de movimientos de productos</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Movimiento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <CardDescription>
            Todos los movimientos de inventario registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No hay movimientos de inventario registrados
              </p>
              <Button className="mt-4" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Movimiento
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Razón</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">
                      {movement.productId}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          movement.type === "in" ? "default" : "secondary"
                        }
                        className="flex items-center w-fit"
                      >
                        <Package className="mr-1 h-3 w-3" />
                        {movement.type === "in" ? "Entrada" : "Salida"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          movement.type === "in"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {movement.type === "in" ? "+" : "-"}
                        {movement.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{movement.reason}</TableCell>
                    <TableCell>
                      {movement.referenceId ? (
                        <div className="flex items-center">
                          <Info className="mr-1 h-3 w-3 text-blue-500" />
                          <span className="text-sm">
                            {movement.referenceType}: {movement.referenceId}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{formatDate(movement.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <InventoryMovementForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          productId={productId}
        />
      )}
    </div>
  );
}
