import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Movement {
  id: string;
  type:
    | "SETTLEMENT"
    | "REFUND"
    | "CHARGEBACK"
    | "WITHDRAWAL"
    | "FEE"
    | "CARD_PURCHASE";
  amount: number;
  currency: string;
  description: string;
  referenceId?: string;
  paymentMethod?: string;
  counterparty?: string;
  movementDate: string;
  reconciled: boolean;
}

interface MovementsTableProps {
  movements: Movement[];
  loading?: boolean;
  onMovementClick?: (movement: Movement) => void;
}

const MovementsTable = ({
  movements,
  loading = false,
  onMovementClick,
}: MovementsTableProps) => {
  const [sortField, setSortField] = useState<
    "movementDate" | "amount" | "type"
  >("movementDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedMovements = useMemo(() => {
    return [...movements].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "movementDate") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [movements, sortField, sortDirection]);

  const handleSort = (field: "movementDate" | "amount" | "type") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      SETTLEMENT: {
        label: "Liquidación",
        color: "text-green-600",
        bg: "bg-green-50",
      },
      REFUND: {
        label: "Reembolso",
        color: "text-orange-600",
        bg: "bg-orange-50",
      },
      CHARGEBACK: {
        label: "Contracargo",
        color: "text-red-600",
        bg: "bg-red-50",
      },
      WITHDRAWAL: { label: "Retiro", color: "text-blue-600", bg: "bg-blue-50" },
      FEE: { label: "Comisión", color: "text-purple-600", bg: "bg-purple-50" },
      CARD_PURCHASE: {
        label: "Compra POS",
        color: "text-indigo-600",
        bg: "bg-indigo-50",
      },
    };
    return (
      labels[type as keyof typeof labels] || {
        label: type,
        color: "text-gray-600",
        bg: "bg-gray-50",
      }
    );
  };

  const formatCurrency = (amount: number, currency: string = "MXN") => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Movimientos Financieros
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {movements.length} movimientos encontrados
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("movementDate")}
              >
                Fecha
                {sortField === "movementDate" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("type")}
              >
                Tipo
                {sortField === "type" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("amount")}
              >
                Monto
                {sortField === "amount" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedMovements.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="text-4xl mb-4">📊</div>
                  <p>No se encontraron movimientos</p>
                  <p className="text-sm">
                    Conecta Mercado Pago para ver tus transacciones
                  </p>
                </td>
              </tr>
            ) : (
              sortedMovements.map((movement) => {
                const typeInfo = getTypeLabel(movement.type);
                return (
                  <tr
                    key={movement.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onMovementClick?.(movement)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(
                        new Date(movement.movementDate),
                        "dd/MM/yyyy HH:mm",
                        { locale: es }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeInfo.bg} ${typeInfo.color}`}
                      >
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {movement.description}
                        </div>
                        {movement.referenceId && (
                          <div className="text-xs text-gray-500">
                            Ref: {movement.referenceId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.paymentMethod || movement.counterparty || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={
                          movement.amount >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatCurrency(movement.amount, movement.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          movement.reconciled
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {movement.reconciled ? "Conciliado" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {sortedMovements.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Mostrando {sortedMovements.length} movimientos
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementsTable;
