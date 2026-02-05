"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuppliersList } from "./SuppliersList";
import { InventoryMovementsList } from "./InventoryMovementsList";
import { InventoryTransfersList } from "./InventoryTransfersList";
import { InventoryLocationsList } from "./InventoryLocationsList";
import { InventoryAlertsList } from "./InventoryAlertsList";
import { InventoryAlertConfigList } from "./InventoryAlertConfigList";

export function InventorySystem() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Sistema de Inventario</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tu inventario, proveedores, movimientos y alertas
        </p>
      </div>

      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
          <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="alert-config">Config. Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-6">
          <SuppliersList />
        </TabsContent>

        <TabsContent value="movements" className="mt-6">
          <InventoryMovementsList />
        </TabsContent>

        <TabsContent value="transfers" className="mt-6">
          <InventoryTransfersList />
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <InventoryLocationsList />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <InventoryAlertsList />
        </TabsContent>

        <TabsContent value="alert-config" className="mt-6">
          <InventoryAlertConfigList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
