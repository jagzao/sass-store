"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SuppliersList } from "./SuppliersList";
import { InventoryMovementsList } from "./InventoryMovementsList";
import { InventoryTransfersList } from "./InventoryTransfersList";
import { InventoryLocationsList } from "./InventoryLocationsList";
import { InventoryAlertsList } from "./InventoryAlertsList";
import { InventoryAlertConfigList } from "./InventoryAlertConfigList";
import { InventoryList } from "./InventoryList";
import { InventoryForm } from "./InventoryForm";
import { InventoryItem } from "@/lib/hooks/useInventory";

export function InventorySystem() {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);

  const handleEditInventoryItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsInventoryFormOpen(true);
  };

  const handleCloseInventoryForm = () => {
    setIsInventoryFormOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Lilac Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-100/50 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="container mx-auto py-8">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-serif font-bold text-[#C5A059]">
            Sistema de Inventario
          </h1>
          <p className="text-gray-500 mt-2 text-lg font-light">
            Gestión integral de existencias y proveedores
          </p>
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          {/* Frosted Glass Navigation */}
          <div className="sticky top-4 z-10 backdrop-blur-md bg-white/70 border border-white/20 rounded-2xl shadow-sm p-2 mb-8">
            <TabsList className="flex flex-wrap md:flex-nowrap w-full justify-between bg-transparent h-auto gap-2 p-0">
              {[
                { value: "inventory", label: "Inventario" },
                { value: "suppliers", label: "Proveedores" },
                { value: "movements", label: "Movimientos" },
                { value: "transfers", label: "Transferencias" },
                { value: "locations", label: "Ubicaciones" },
                { value: "alerts", label: "Alertas" },
                { value: "alert-config", label: "Configuración" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                    data-[state=active]:bg-[#C5A059] data-[state=active]:text-white data-[state=active]:shadow-md
                    data-[state=inactive]:text-[#333333] data-[state=inactive]:hover:bg-[#C5A059]/10 data-[state=inactive]:hover:text-[#C5A059]
                    border border-transparent data-[state=inactive]:hover:border-[#C5A059]/20"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="bg-white/50 rounded-3xl p-6 border border-white/50 shadow-sm backdrop-blur-sm">
            <TabsContent value="inventory" className="mt-0 outline-none">
              <InventoryList onEdit={handleEditInventoryItem} />
            </TabsContent>

            <TabsContent value="suppliers" className="mt-0 outline-none">
              <SuppliersList />
            </TabsContent>

            <TabsContent value="movements" className="mt-0 outline-none">
              <InventoryMovementsList />
            </TabsContent>

            <TabsContent value="transfers" className="mt-0 outline-none">
              <InventoryTransfersList />
            </TabsContent>

            <TabsContent value="locations" className="mt-0 outline-none">
              <InventoryLocationsList />
            </TabsContent>

            <TabsContent value="alerts" className="mt-0 outline-none">
              <InventoryAlertsList />
            </TabsContent>

            <TabsContent value="alert-config" className="mt-0 outline-none">
              <InventoryAlertConfigList />
            </TabsContent>
          </div>
        </Tabs>

        <Dialog
          open={isInventoryFormOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseInventoryForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Inventario</DialogTitle>
            </DialogHeader>
            <InventoryForm
              key={selectedItem?.id ?? "inventory-form"}
              item={selectedItem ?? undefined}
              compact
              onCancel={handleCloseInventoryForm}
              onSuccess={handleCloseInventoryForm}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
