import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SearchableSelectSingle } from "@/components/ui/forms/SearchableSelectSingle";
import { SelectOption } from "@/components/ui/forms/SearchableSelect";

interface FilterOptions {
  type?: string;
  paymentMethod?: string;
  status?: "reconciled" | "unreconciled";
  from?: Date;
  to?: Date;
  search?: string;
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
  loading?: boolean;
}

const FilterPanel = ({
  filters,
  onFiltersChange,
  onReset,
  loading = false,
}: FilterPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const movementTypes = useMemo<SelectOption[]>(
    () => [
      { value: "SETTLEMENT", label: "Liquidaciones" },
      { value: "REFUND", label: "Reembolsos" },
      { value: "CHARGEBACK", label: "Contracargos" },
      { value: "WITHDRAWAL", label: "Retiros" },
      { value: "FEE", label: "Comisiones" },
      { value: "CARD_PURCHASE", label: "Compras POS" },
    ],
    [],
  );

  const paymentMethods = useMemo<SelectOption[]>(
    () => [
      { value: "credit_card", label: "Credit Card" },
      { value: "debit_card", label: "Debit Card" },
      { value: "bank_transfer", label: "Bank Transfer" },
      { value: "cash", label: "Cash" },
      { value: "digital_wallet", label: "Digital Wallet" },
    ],
    [],
  );

  const statusOptions = useMemo<SelectOption[]>(
    () => [
      { value: "reconciled", label: "Conciliados" },
      { value: "unreconciled", label: "Pendientes" },
    ],
    [],
  );

  const handleFilterChange = (
    key: keyof FilterOptions,
    value: string | Date | undefined,
  ) => {
    const newFilters = { ...filters };

    if (value === "" || value === undefined) {
      delete newFilters[key];
    } else {
      // Type assertion to match FilterOptions value types
      (newFilters[key] as typeof value) = value;
    }

    onFiltersChange(newFilters);
  };

  const getDateString = (date?: Date) => {
    return date ? format(date, "yyyy-MM-dd") : "";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {isExpanded ? "Ocultar filtros" : "Mostrar filtros avanzados"}
          </button>
          <button
            onClick={onReset}
            className="text-sm text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Filtros básicos siempre visibles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Referencia, descripción..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <SearchableSelectSingle
            options={[
              { value: "", label: "Todos los tipos" },
              ...movementTypes,
            ]}
            value={filters.type || ""}
            onChange={(option: SelectOption | null) =>
              handleFilterChange("type", option?.value)
            }
            placeholder="Seleccionar tipo"
            isSearchable={true}
            isDisabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <SearchableSelectSingle
            options={[
              { value: "", label: "Todos los estados" },
              ...statusOptions,
            ]}
            value={filters.status || ""}
            onChange={(option: SelectOption | null) =>
              handleFilterChange("status", option?.value)
            }
            placeholder="Seleccionar estado"
            isSearchable={false}
            isDisabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Método de Pago
          </label>
          <SearchableSelectSingle
            options={[
              { value: "", label: "Todos los métodos" },
              ...paymentMethods,
            ]}
            value={filters.paymentMethod || ""}
            onChange={(option: SelectOption | null) =>
              handleFilterChange("paymentMethod", option?.value)
            }
            placeholder="Seleccionar método"
            isSearchable={true}
            isDisabled={loading}
          />
        </div>
      </div>

      {/* Filtros avanzados (expandibles) */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={getDateString(filters.from)}
                onChange={(e) =>
                  handleFilterChange(
                    "from",
                    e.target.value ? new Date(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={getDateString(filters.to)}
                onChange={(e) =>
                  handleFilterChange(
                    "to",
                    e.target.value ? new Date(e.target.value) : undefined,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {Object.keys(filters).length > 0 && (
                <span>
                  {Object.keys(filters).length} filtro
                  {Object.keys(filters).length !== 1 ? "s" : ""} activo
                  {Object.keys(filters).length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Contraer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen de filtros activos */}
      {!isExpanded && Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.type && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Tipo: {movementTypes.find((t) => t.value === filters.type)?.label}
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Estado:{" "}
              {filters.status === "reconciled" ? "Conciliado" : "Pendiente"}
            </span>
          )}
          {filters.paymentMethod && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Método:{" "}
              {
                paymentMethods.find((m) => m.value === filters.paymentMethod)
                  ?.label
              }
            </span>
          )}
          {filters.from && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Desde: {format(filters.from, "dd/MM/yyyy", { locale: es })}
            </span>
          )}
          {filters.to && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Hasta: {format(filters.to, "dd/MM/yyyy", { locale: es })}
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Búsqueda: "{filters.search}"
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
