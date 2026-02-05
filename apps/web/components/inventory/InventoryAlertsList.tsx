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
import { useInventoryAlerts } from "@/lib/hooks";
import {
  InventoryAlert,
  AcknowledgeAlertData,
} from "@/lib/hooks/useInventoryAlerts";
import { AlertTriangle, Check, X } from "lucide-react";

interface InventoryAlertsListProps {
  productId?: string;
  onEdit?: (alert: InventoryAlert) => void;
  onCreate?: () => void;
}

export function InventoryAlertsList({
  productId,
  onEdit,
  onCreate,
}: InventoryAlertsListProps) {
  const { alerts, loading, error, acknowledgeInventoryAlert } =
    useInventoryAlerts({ productId });
  const [selectedAlert, setSelectedAlert] = useState<InventoryAlert | null>(
    null,
  );

  const handleAcknowledge = async (alert: InventoryAlert) => {
    try {
      await acknowledgeInventoryAlert(alert.id, {
        isAcknowledged: !alert.isAcknowledged,
      });
    } catch (error) {
      console.error("Error al actualizar alerta:", error);
    }
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

  if (loading && alerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p>Cargando alertas de inventario...</p>
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
          <h2 className="text-2xl font-bold">Alertas de Inventario</h2>
          <p className="text-gray-600">Gestiona las alertas de tu inventario</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alertas</CardTitle>
          <CardDescription>
            Todas las alertas de inventario registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No hay alertas de inventario registradas
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">
                      {alert.productId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                        <span>{alert.alertType}</span>
                      </div>
                    </TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          alert.isAcknowledged ? "outline" : "destructive"
                        }
                      >
                        {alert.isAcknowledged ? "Reconocida" : "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(alert.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(alert)}
                      >
                        {alert.isAcknowledged ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
