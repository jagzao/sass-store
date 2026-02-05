"use client";

import { useState } from "react";
import { useRetouchConfig } from "@/lib/hooks";

interface RetouchConfig {
  id: string;
  serviceId: string;
  serviceName: string;
  frequencyType: string;
  frequencyValue: number;
  isActive: boolean;
  isDefault: boolean;
  businessDaysOnly: boolean;
}

interface ServiceOption {
  id: string;
  name: string;
}

export function RetouchConfigManager() {
  const { configs, loading, error, createOrUpdateConfig, refetch } =
    useRetouchConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<RetouchConfig | null>(
    null,
  );
  const [formData, setFormData] = useState({
    serviceId: "",
    frequencyType: "days",
    frequencyValue: 15,
    isActive: true,
    isDefault: false,
    businessDaysOnly: false,
  });

  // Mock services - in a real app, these would come from an API
  const services: ServiceOption[] = [
    { id: "1", name: "Manicure" },
    { id: "2", name: "Pedicure" },
    { id: "3", name: "Facial" },
    { id: "4", name: "Depilación" },
    { id: "5", name: "Masaje" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOrUpdateConfig(formData);
    setIsModalOpen(false);
    setFormData({
      serviceId: "",
      frequencyType: "days",
      frequencyValue: 15,
      isActive: true,
      isDefault: false,
      businessDaysOnly: false,
    });
  };

  const handleEdit = (config: RetouchConfig) => {
    setEditingConfig(config);
    setFormData({
      serviceId: config.serviceId,
      frequencyType: config.frequencyType,
      frequencyValue: config.frequencyValue,
      isActive: config.isActive,
      isDefault: config.isDefault,
      businessDaysOnly: config.businessDaysOnly,
    });
    setIsModalOpen(true);
  };

  const getFrequencyLabel = (type: string, value: number) => {
    switch (type) {
      case "days":
        return `Cada ${value} día${value !== 1 ? "s" : ""}`;
      case "weeks":
        return `Cada ${value} semana${value !== 1 ? "s" : ""}`;
      case "months":
        return `Cada ${value} mes${value !== 1 ? "es" : ""}`;
      default:
        return `${value} ${type}`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Configuración de Retoques
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona las frecuencias de retoque por servicio
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Nueva Configuración
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Servicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Frecuencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Días Hábiles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {configs.map((config) => (
              <tr key={config.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {config.serviceName}
                    {config.isDefault && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Por defecto
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getFrequencyLabel(
                      config.frequencyType,
                      config.frequencyValue,
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {config.businessDaysOnly ? "Sí" : "No"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      config.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {config.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(config)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {configs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay configuraciones de retoque.</p>
        </div>
      )}

      {/* Modal for creating/editing config */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingConfig ? "Editar Configuración" : "Nueva Configuración"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Servicio
                </label>
                <select
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Seleccionar servicio</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Tipo de Frecuencia
                </label>
                <select
                  name="frequencyType"
                  value={formData.frequencyType}
                  onChange={handleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="days">Días</option>
                  <option value="weeks">Semanas</option>
                  <option value="months">Meses</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  name="frequencyValue"
                  value={formData.frequencyValue}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="1"
                  required
                />
              </div>

              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="businessDaysOnly"
                  checked={formData.businessDaysOnly}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-gray-700 text-sm">
                  Considerar solo días hábiles
                </label>
              </div>

              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-gray-700 text-sm">
                  Configuración por defecto
                </label>
              </div>

              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-gray-700 text-sm">Activo</label>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingConfig(null);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {editingConfig ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
