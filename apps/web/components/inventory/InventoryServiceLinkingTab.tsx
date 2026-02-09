"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

interface ProductServiceRelation {
  id: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  optional: boolean;
  createdAt: string | Date;
}

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  duration: number;
  active: boolean;
}

interface InventoryServiceLinkingTabProps {
  productId: string;
}

export function InventoryServiceLinkingTab({
  productId,
}: InventoryServiceLinkingTabProps) {
  const [relations, setRelations] = useState<ProductServiceRelation[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventory/${productId}/services`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar vinculación de servicios");
      }

      setRelations(data.relations ?? []);
      setServices(data.services ?? []);
    } catch (err: any) {
      setError(err.message || "Error al cargar vinculación de servicios");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const availableServices = useMemo(() => {
    const linkedServiceIds = new Set(relations.map((relation) => relation.serviceId));
    return services.filter((service) => !linkedServiceIds.has(service.id));
  }, [relations, services]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedServiceId || quantity <= 0) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventory/${productId}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          quantity,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo vincular el servicio");
      }

      setSelectedServiceId("");
      setQuantity(1);
      await loadData();
    } catch (err: any) {
      setError(err.message || "No se pudo vincular el servicio");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLink = async (serviceId: string) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/inventory/${productId}/services/${serviceId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo remover la vinculación");
      }

      await loadData();
    } catch (err: any) {
      setError(err.message || "No se pudo remover la vinculación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Vinculación a Servicios</h3>
        <p className="text-xs text-gray-500 mt-1">
          Configura en qué servicios se descuenta este producto y con qué cantidad.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleAddLink}
        className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      >
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Servicio
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving || loading}
          >
            <option value="">Seleccionar servicio</option>
            {availableServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.duration} min)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving || loading}
          />
        </div>

        <button
          type="submit"
          disabled={saving || loading || !selectedServiceId}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Vincular"}
        </button>
      </form>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Servicio
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Cantidad
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-sm text-gray-500">
                  Cargando relaciones...
                </td>
              </tr>
            ) : relations.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-sm text-gray-500">
                  Este producto no está vinculado a ningún servicio.
                </td>
              </tr>
            ) : (
              relations.map((relation) => (
                <tr key={relation.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {relation.serviceName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {relation.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(relation.serviceId)}
                      className="text-red-600 hover:text-red-700"
                      disabled={saving}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

