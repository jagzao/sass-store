"use client";

import { useState } from "react";

interface BudgetManagerClientProps {
  tenantId: string;
}

export function BudgetManagerClient({ tenantId }: BudgetManagerClientProps) {
  const [showForm, setShowForm] = useState(false);

  const handleCreateBudget = async () => {
    try {
      // Simulate budget creation
      console.log("Creating budget for tenant:", tenantId);
      alert("Presupuesto creado exitosamente (simulación)");
    } catch (error) {
      console.error("Error creating budget:", error);
      alert("Error al crear presupuesto");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-500 mt-1">
            Gestiona tus presupuestos semanales, quincenales o mensuales
          </p>
        </div>
        <button
          onClick={handleCreateBudget}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nuevo Presupuesto
        </button>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-gray-500">
          Componente de presupuestos cargado correctamente. Tenant: {tenantId}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          (Versión simplificada para evitar errores de renderizado)
        </p>
      </div>
    </div>
  );
}