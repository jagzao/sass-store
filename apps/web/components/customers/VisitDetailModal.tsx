"use client";

import { X, Calendar, DollarSign, FileText, Clock } from "lucide-react";

interface Visit {
  id: string;
  visitNumber: number;
  visitDate: string;
  totalAmount: number;
  notes?: string;
  nextVisitFrom?: string;
  nextVisitTo?: string;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  services: {
    id: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

interface VisitDetailModalProps {
  visit: Visit;
  onClose: () => void;
}

export default function VisitDetailModal({ visit, onClose }: VisitDetailModalProps) {
  const getStatusBadge = (status: Visit["status"]) => {
    const statusConfig = {
      pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
      scheduled: { label: "Programada", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Completada", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelada", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status];
    return (
      <span
        className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Visita #{visit.visitNumber}
            </h2>
            {getStatusBadge(visit.status)}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Visit Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de Atención</p>
                <p className="mt-1 text-base text-gray-900">
                  {new Date(visit.visitDate).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(visit.visitDate).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  ${visit.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Servicios Realizados</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visit.services.map((service) => (
                    <tr key={service.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {service.serviceName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        ${service.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {service.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        ${service.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-sm font-medium text-gray-900 text-right"
                    >
                      Total:
                    </td>
                    <td className="px-4 py-3 text-base font-bold text-gray-900 text-right">
                      ${visit.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Next Visit */}
          {(visit.nextVisitFrom || visit.nextVisitTo) && (
            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Próxima Cita Sugerida</p>
                <p className="mt-1 text-base text-blue-800">
                  {visit.nextVisitFrom &&
                    new Date(visit.nextVisitFrom).toLocaleDateString("es-MX")}
                  {visit.nextVisitTo &&
                    ` - ${new Date(visit.nextVisitTo).toLocaleDateString("es-MX")}`}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {visit.notes && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">Observaciones</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
