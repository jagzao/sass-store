"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SyncEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  status: "new" | "existing";
  reason?: string;
}

interface SkippedEvent {
  id: string;
  summary: string;
  reason: string;
}

interface SyncPreviewData {
  new: SyncEvent[];
  existing: SyncEvent[];
  skipped: SkippedEvent[];
  errors: any[];
}

interface SyncDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  data: SyncPreviewData;
  initialTab?: "new" | "existing" | "skipped";
}

export default function SyncDetailsModal({
  isOpen,
  onClose,
  onConfirm,
  data,
  initialTab = "new",
}: SyncDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"new" | "existing" | "skipped">(
    initialTab,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection when data changes or modal opens
  useEffect(() => {
    if (isOpen && data.new) {
      // Default select all new events? Or none?
      // User usually wants to sync all new ones, so let's select all by default.
      const allNewIds = new Set(data.new.map((e) => e.id));
      setSelectedIds(allNewIds);
      setActiveTab(initialTab);
    }
  }, [isOpen, data, initialTab]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === data.new.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.new.map((e) => e.id)));
    }
  };

  const renderEventList = (
    events: any[],
    type: "new" | "existing" | "skipped",
  ) => {
    if (events.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          No se encontraron eventos en esta categoría.
        </div>
      );
    }

    return (
      <div className="overflow-y-auto max-h-[60vh]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {type === "new" && (
                <th className="px-6 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === events.length && events.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado/Razón
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                {type === "new" && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(event.id)}
                      onChange={() => handleToggleSelect(event.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {event.summary || "Sin título"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {event.start
                    ? format(new Date(event.start), "dd/MM/yyyy HH:mm", {
                        locale: es,
                      })
                    : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      type === "new"
                        ? "bg-green-100 text-green-800"
                        : type === "existing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {type === "new"
                      ? "Nuevo"
                      : type === "existing"
                        ? "Sincronizado"
                        : event.reason || "Omitido"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            Detalles de Sincronización
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="border-b px-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("new")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "new"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Nuevos ({data.new.length})
            </button>
            <button
              onClick={() => setActiveTab("existing")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "existing"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Ya Sincronizados ({data.existing.length})
            </button>
            <button
              onClick={() => setActiveTab("skipped")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "skipped"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Omitidos/Errores ({data.skipped.length + data.errors.length})
            </button>
          </nav>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50">
          {activeTab === "new" && renderEventList(data.new, "new")}
          {activeTab === "existing" &&
            renderEventList(data.existing, "existing")}
          {activeTab === "skipped" &&
            renderEventList([...data.skipped, ...data.errors], "skipped")}
        </div>

        <div className="p-6 border-t bg-white flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(Array.from(selectedIds))}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Sincronizar {selectedIds.size} eventos
          </button>
        </div>
      </div>
    </div>
  );
}
