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
import { useInventoryTransfers } from "@/lib/hooks";
import {
  InventoryTransfer,
  CreateInventoryTransferData,
} from "@/lib/hooks/useInventoryTransfers";
import { Plus, ArrowRight, MapPin } from "lucide-react";
import { InventoryTransferForm } from "./InventoryTransferForm";

interface InventoryTransfersListProps {
  productId?: string;
  onEdit?: (transfer: InventoryTransfer) => void;
  onCreate?: () => void;
}

export function InventoryTransfersList({
  productId,
  onEdit,
  onCreate,
}: InventoryTransfersListProps) {
  const { transfers, loading, error, createInventoryTransfer } =
    useInventoryTransfers({ productId });
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "in_progress":
        return "En Progreso";
      case "completed":
        return "Completado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  if (loading && transfers.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p>Cargando transferencias de inventario...</p>
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
          <h2 className="text-2xl font-bold">Transferencias de Inventario</h2>
          <p className="text-gray-600">
            Gestiona las transferencias entre ubicaciones
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Transferencia
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Transferencias</CardTitle>
          <CardDescription>
            Todas las transferencias de inventario registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No hay transferencias de inventario registradas
              </p>
              <Button className="mt-4" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Transferencia
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">
                      {transfer.productId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-4 w-4 text-blue-500" />
                        <span>{transfer.fromLocationId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-4 w-4 text-green-500" />
                        <span>{transfer.toLocationId}</span>
                      </div>
                    </TableCell>
                    <TableCell>{transfer.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(transfer.status)}>
                        {getStatusText(transfer.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(transfer.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <InventoryTransferForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          productId={productId}
        />
      )}
    </div>
  );
}
