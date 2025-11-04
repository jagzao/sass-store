import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Movement {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  referenceId?: string;
  reconciled: boolean;
  reconciliationId?: string;
  movementDate: string;
}

interface ReconciliationModalProps {
  movement: Movement | null;
  isOpen: boolean;
  onClose: () => void;
  onReconcile: (
    movementId: string,
    reconciled: boolean,
    reconciliationId?: string
  ) => Promise<void>;
  loading?: boolean;
}

const ReconciliationModal = ({
  movement,
  isOpen,
  onClose,
  onReconcile,
  loading = false,
}: ReconciliationModalProps) => {
  const [reconciled, setReconciled] = useState(movement?.reconciled || false);
  const [reconciliationId, setReconciliationId] = useState(
    movement?.reconciliationId || ""
  );
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movement) return;

    try {
      await onReconcile(
        movement.id,
        reconciled,
        reconciliationId.trim() || undefined
      );
      onClose();
    } catch (error) {
      console.error("Error reconciling movement:", error);
    }
  };

  const formatCurrency = (amount: number, currency: string = "MXN") => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      SETTLEMENT: "Liquidación",
      REFUND: "Reembolso",
      CHARGEBACK: "Contracargo",
      WITHDRAWAL: "Retiro",
      FEE: "Comisión",
      CARD_PURCHASE: "Compra POS",
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!isOpen || !movement) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Conciliar Movimiento
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Movement Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Tipo:</span>
                <p className="text-gray-900">{getTypeLabel(movement.type)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Monto:</span>
                <p
                  className={`font-semibold ${movement.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(movement.amount, movement.currency)}
                </p>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Descripción:</span>
                <p className="text-gray-900">{movement.description}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Fecha:</span>
                <p className="text-gray-900">
                  {format(new Date(movement.movementDate), "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Referencia:</span>
                <p className="text-gray-900">{movement.referenceId || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Reconciliation Status */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={reconciled}
                onChange={(e) => setReconciled(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Marcar como conciliado
              </span>
            </label>
          </div>

          {/* Reconciliation ID */}
          {reconciled && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID de Conciliación (opcional)
              </label>
              <input
                type="text"
                value={reconciliationId}
                onChange={(e) => setReconciliationId(e.target.value)}
                placeholder="Ej: REC-2025-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Identificador único para rastrear esta conciliación
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar notas sobre esta conciliación..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading
                ? "Conciliando..."
                : reconciled
                  ? "Conciliar"
                  : "Desconciliar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReconciliationModal;
