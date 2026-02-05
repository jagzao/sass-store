"use client";

import { useState } from "react";
import { RetouchCustomersList } from "./RetouchCustomersList";
import { RetouchConfigManager } from "./RetouchConfigManager";
import { HolidaysManager } from "./HolidaysManager";

export function RetouchSystem() {
  const [activeTab, setActiveTab] = useState<
    "customers" | "config" | "holidays"
  >("customers");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema de Fechas de Retoque
        </h1>
        <p className="text-gray-600">
          Gestiona las fechas de contacto con clientes, configura frecuencias
          por servicio y administra días festivos.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("customers")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "customers"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Clientes
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "config"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Configuración
          </button>
          <button
            onClick={() => setActiveTab("holidays")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "holidays"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Días Festivos
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "customers" && <RetouchCustomersList />}
        {activeTab === "config" && <RetouchConfigManager />}
        {activeTab === "holidays" && <HolidaysManager />}
      </div>
    </div>
  );
}
