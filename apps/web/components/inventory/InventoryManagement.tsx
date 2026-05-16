"use client";

import React, { useState } from "react";
import { InventoryList } from "./InventoryList";
import { InventoryForm } from "./InventoryForm";
import { InventoryAlerts } from "./InventoryAlerts";
import { ServiceProducts } from "./ServiceProducts";
import { InventoryTransactions } from "./InventoryTransactions";
import { InventoryItem } from "@/lib/hooks/useInventory";
import { InventoryAlert } from "@/lib/hooks/useInventoryAlerts";
import { ServiceProduct } from "@/lib/hooks/useServiceProducts";

type TabType = "inventory" | "alerts" | "service-products" | "transactions";

interface InventoryManagementProps {
  serviceId?: string;
  initialTab?: TabType;
}

export function InventoryManagement({
  serviceId,
  initialTab = "inventory",
}: InventoryManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Manejar selección de item en la lista
  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItem(item);
  };

  // Manejar edición de item
  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  // Manejar cierre del formulario
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedItem(null);
  };

  // Manejar éxito en el formulario
  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedItem(null);
    // Aquí podrías recargar los datos si es necesario
  };

  // Pestañas de navegación
  const tabs = [
    { id: "inventory" as TabType, label: "Inventario", icon: "ðŸ“¦" },
    { id: "alerts" as TabType, label: "Alertas", icon: "ðŸ””" },
    ...(serviceId
      ? [
          {
            id: "service-products" as TabType,
            label: "Productos del Servicio",
            icon: "ðŸ”—",
          },
        ]
      : []),
    { id: "transactions" as TabType, label: "Transacciones", icon: "ðŸ“Š" },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Inventario
        </h1>
        <p className="mt-2 text-gray-600">
          Administra tu inventario, alertas, productos y transacciones desde un
          solo lugar.
        </p>
      </div>

      {/* Pestañas de navegación */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido de las pestañas */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        {/* Pestaña de Inventario */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Inventario de Productos
              </h2>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Nuevo Producto
              </button>
            </div>

            {showForm ? (
              <InventoryForm
                item={selectedItem || undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleCloseForm}
              />
            ) : (
              <InventoryList
                onEdit={handleEditItem}
                onSelect={handleSelectItem}
              />
            )}
          </div>
        )}

        {/* Pestaña de Alertas */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Alertas de Inventario
            </h2>
            <InventoryAlerts
              onResolve={(alert: InventoryAlert) => {
                console.warn("Alerta resuelta:", alert);
              }}
              onDelete={(alert: InventoryAlert) => {
                console.warn("Alerta eliminada:", alert);
              }}
            />
          </div>
        )}

        {/* Pestaña de Productos del Servicio */}
        {activeTab === "service-products" && serviceId && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Productos del Servicio
            </h2>
            <ServiceProducts
              serviceId={serviceId}
              onAdd={(product: ServiceProduct) => {
                console.warn("Producto agregado al servicio:", product);
              }}
              onRemove={(product: ServiceProduct) => {
                console.warn("Producto eliminado del servicio:", product);
              }}
            />
          </div>
        )}

        {/* Pestaña de Transacciones */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Historial de Transacciones
            </h2>
            <InventoryTransactions
              onExport={() => {
                console.warn("Transacciones exportadas");
              }}
            />
          </div>
        )}
      </div>

      {/* Panel de información del item seleccionado */}
      {selectedItem && !showForm && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Información del Producto
              </h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Producto</p>
                  <p className="font-medium">{selectedItem.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SKU</p>
                  <p className="font-medium">{selectedItem.productSku}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stock Total</p>
                  <p className="font-medium">{selectedItem.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stock Disponible</p>
                  <p className="font-medium">
                    {selectedItem.availableQuantity}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Precio Unitario</p>
                  <p className="font-medium">
                    ${selectedItem.unitPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor Total</p>
                  <p className="font-medium">
                    ${selectedItem.totalValue.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Punto de Reorden</p>
                  <p className="font-medium">{selectedItem.reorderPoint}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <p className="font-medium">
                    {selectedItem.isActive ? "Activo" : "Inactivo"}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              âœ•
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
