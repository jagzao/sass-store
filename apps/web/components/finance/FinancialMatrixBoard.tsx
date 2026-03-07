"use client";

import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Plus } from "lucide-react";
import {
  cloneMonthlyPlanning,
  fetchFinancialMatrix,
  markMatrixCellPaid,
  MatrixCell,
  MatrixData,
  MatrixGranularity,
  MatrixLoadFilters,
  MatrixUpsertCellPayload,
  upsertMatrixCell,
} from "@/lib/api/financial-matrix";
import {
  isFailure,
  isSuccess,
  Result,
} from "@sass-store/core/src/result";
import {
  DomainError,
  getHttpStatusCode,
} from "@sass-store/core/src/errors/types";

type FilterState = {
  granularity: MatrixGranularity;
  startDate: string;
  endDate: string;
  entityId: string;
};

type ActiveCell = {
  categoryId: string;
  bucketId: string;
};

type SelectCategoryState = {
  groupLabel: string;
  isOpen: boolean;
};

type CellEditorState = {
  projectedAmount: string;
  paymentAmount: string;
  description: string;
  paymentDate: string;
};

const EMPTY_CATEGORIES: MatrixData["categories"] = [];
const EMPTY_BUCKETS: MatrixData["timeBuckets"] = [];

const STORAGE_FILTER_KEY = "finance-matrix-filters-v1";
const STORAGE_SCROLL_KEY = "finance-matrix-scroll-v1";

const granularityLabel: Record<MatrixGranularity, string> = {
  week: "Semana",
  fortnight: "Quincena",
  month: "Mes",
  year: "Año",
};

const formatMoney = (value: string): string => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(parsed);
};

const getCurrentYearRange = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const year = now.getFullYear();
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
};

const toIsoDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentIsoWeekRange = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + offsetToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startDate: toIsoDateString(monday),
    endDate: toIsoDateString(sunday),
  };
};

const getDefaultDateRangeByGranularity = (
  granularity: MatrixGranularity,
): { startDate: string; endDate: string } => {
  if (granularity === "week") {
    return getCurrentIsoWeekRange();
  }

  return getCurrentYearRange();
};

const readStoredFilters = (): FilterState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(STORAGE_FILTER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<FilterState>;
    if (
      parsed.granularity &&
      ["week", "fortnight", "month", "year"].includes(parsed.granularity) &&
      typeof parsed.startDate === "string" &&
      typeof parsed.endDate === "string"
    ) {
      return {
        granularity: parsed.granularity,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        entityId: typeof parsed.entityId === "string" ? parsed.entityId : "",
      };
    }
  } catch {
    return null;
  }

  return null;
};

const persistFilters = (filters: FilterState): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(STORAGE_FILTER_KEY, JSON.stringify(filters));
};

const persistScroll = (value: number): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(STORAGE_SCROLL_KEY, String(value));
};

const readStoredScroll = (): number => {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.sessionStorage.getItem(STORAGE_SCROLL_KEY);
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return 0;
};

const getCellEditorDefault = (cell?: MatrixCell): CellEditorState => ({
  projectedAmount: cell?.projectedAmount ?? "",
  paymentAmount: "",
  description: "",
  paymentDate: new Date().toISOString().split("T")[0],
});

interface FinancialMatrixBoardProps {
  tenantId: string;
}

function FinancialMatrixBoardComponent({ tenantId }: FinancialMatrixBoardProps) {
  const [filters, setFilters] = useState<FilterState>(() => {
    const stored = readStoredFilters();

    if (stored) {
      if (stored.granularity === "week") {
        const currentWeekRange = getCurrentIsoWeekRange();
        return {
          ...stored,
          startDate: currentWeekRange.startDate,
          endDate: currentWeekRange.endDate,
        };
      }

      return stored;
    }

    const defaultGranularity: MatrixGranularity = "week";
    const defaultDateRange = getDefaultDateRangeByGranularity(defaultGranularity);

    return {
      granularity: defaultGranularity,
      startDate: defaultDateRange.startDate,
      endDate: defaultDateRange.endDate,
      entityId: "",
    };
  });

  const [matrixResult, setMatrixResult] = useState<Result<MatrixData, DomainError> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>("");
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [cellEditor, setCellEditor] = useState<CellEditorState>({
    projectedAmount: "",
    paymentAmount: "",
    description: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [isSavingCell, setIsSavingCell] = useState<boolean>(false);
  const [isPayingCell, setIsPayingCell] = useState<boolean>(false);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [cloneForm, setCloneForm] = useState<{ sourceBucketId: string; targetBucketId: string }>({
    sourceBucketId: "",
    targetBucketId: "",
  });
  
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const [selectCategoryGroup, setSelectCategoryGroup] = useState<SelectCategoryState | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const loadMatrix = useCallback(async () => {
    setLoading(true);

    const payload: MatrixLoadFilters = {
      tenantId,
      granularity: filters.granularity,
      startDate: filters.startDate,
      endDate: filters.endDate,
      entityId: filters.entityId || undefined,
    };

    const result = await fetchFinancialMatrix(payload);
    setMatrixResult(result);
    setLoading(false);
  }, [tenantId, filters]);

  useEffect(() => {
    persistFilters(filters);
  }, [filters]);

  useEffect(() => {
    void loadMatrix();
  }, [loadMatrix]);

  useEffect(() => {
    if (!scrollContainerRef.current) {
      return;
    }

    const scroll = readStoredScroll();
    if (scroll > 0) {
      scrollContainerRef.current.scrollLeft = scroll;
    }
  }, [matrixResult?.success]);

  const matrixData = matrixResult && isSuccess(matrixResult) ? matrixResult.data : null;
  const categories = matrixData?.categories ?? EMPTY_CATEGORIES;
  const buckets = matrixData?.timeBuckets ?? EMPTY_BUCKETS;

  const entityOptions = useMemo(() => [{ id: "", label: "Todas" }], []);

  const cellMap = useMemo(() => {
    const map = new Map<string, MatrixCell>();
    if (!matrixData) {
      return map;
    }

    for (const cell of matrixData.cells) {
      map.set(`${cell.categoryId}::${cell.bucketId}`, cell);
    }

    return map;
  }, [matrixData]);

  const activeBucket = useMemo(() => {
    if (!activeCell) {
      return null;
    }

    return buckets.find((bucket) => bucket.id === activeCell.bucketId) ?? null;
  }, [activeCell, buckets]);

  const setGranularity = useCallback((granularity: MatrixGranularity) => {
    setFilters((prev) => ({ ...prev, granularity }));
  }, []);

  const setStartDate = useCallback((startDate: string) => {
    setFilters((prev) => ({ ...prev, startDate }));
  }, []);

  const setEndDate = useCallback((endDate: string) => {
    setFilters((prev) => ({ ...prev, endDate }));
  }, []);

  const setEntityId = useCallback((entityId: string) => {
    setFilters((prev) => ({ ...prev, entityId }));
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) {
      return;
    }

    persistScroll(scrollContainerRef.current.scrollLeft);
  }, []);

  const openCellEditor = useCallback(
    (categoryId: string, bucketId: string) => {
      const cell = cellMap.get(`${categoryId}::${bucketId}`);
      setCellEditor(getCellEditorDefault(cell));
      setActiveCell({ categoryId, bucketId });
      setActionMessage("");
    },
    [cellMap],
  );

  const closeCellEditor = useCallback(() => {
    setActiveCell(null);
  }, []);

  const handleSaveProjectedAmount = useCallback(async () => {
    if (!activeCell || !activeBucket) {
      return;
    }

    setIsSavingCell(true);

    const payload: MatrixUpsertCellPayload = {
      tenantId,
      categoryId: activeCell.categoryId,
      granularity: filters.granularity,
      bucketId: activeCell.bucketId,
      bucketStartDate: activeBucket.startDate,
      bucketEndDate: activeBucket.endDate,
      projectedAmount: cellEditor.projectedAmount,
      entityId: filters.entityId || undefined,
      notes: cellEditor.description || undefined,
    };

    const result = await upsertMatrixCell(payload);

    if (isFailure(result)) {
      setActionMessage(result.error.message);
      setIsSavingCell(false);
      return;
    }

    await loadMatrix();
    setActionMessage("Planeación guardada correctamente");
    setIsSavingCell(false);
    setActiveCell(null);
  }, [
    activeBucket,
    activeCell,
    cellEditor.projectedAmount,
    filters.entityId,
    filters.granularity,
    loadMatrix,
    tenantId,
  ]);

  const handleMarkPaid = useCallback(async () => {
    if (!activeCell || !activeBucket) {
      return;
    }

    setIsPayingCell(true);

    const result = await markMatrixCellPaid({
      tenantId,
      categoryId: activeCell.categoryId,
      amount: cellEditor.paymentAmount,
      fechaProgramada: cellEditor.paymentDate || activeBucket.startDate,
      fechaPago: cellEditor.paymentDate || activeBucket.startDate,
      entityId: filters.entityId || undefined,
      description: cellEditor.description || `Pago desde matriz ${activeCell.bucketId}`,
    });

    if (isFailure(result)) {
      setActionMessage(result.error.message);
      setIsPayingCell(false);
      return;
    }

    await loadMatrix();
    setActionMessage("Pago confirmado correctamente");
    setIsPayingCell(false);
    setActiveCell(null);
  }, [
    activeBucket,
    activeCell,
    cellEditor.paymentAmount,
    filters.entityId,
    loadMatrix,
    tenantId,
  ]);

  const monthBuckets = useMemo(
    () => buckets.filter((bucket) => /^M\d{4}-\d{2}$/.test(bucket.id)),
    [buckets],
  );

  const groupedCategories = useMemo(() => {
    const incomes = categories
      .filter((category) => category.type === "income" && (addedCategories.includes(category.id) || Array.from(cellMap.values()).some(cell => cell.categoryId === category.id)))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const expenses = categories
      .filter((category) => category.type === "expense" && (addedCategories.includes(category.id) || Array.from(cellMap.values()).some(cell => cell.categoryId === category.id)))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return [
      { label: "Ingresos", items: incomes, type: "income" },
      { label: "Egresos", items: expenses, type: "expense" },
    ].filter((group) => group.items.length > 0 || categories.some(cat => cat.type === group.type));
  }, [categories, addedCategories, cellMap]);

  useEffect(() => {
    if (monthBuckets.length === 0) {
      setCloneForm((prev) =>
        prev.sourceBucketId === "" && prev.targetBucketId === ""
          ? prev
          : { sourceBucketId: "", targetBucketId: "" },
      );
      return;
    }

    setCloneForm((prev) => {
      const next = {
        sourceBucketId: prev.sourceBucketId || monthBuckets[0].id,
        targetBucketId:
          prev.targetBucketId ||
          (monthBuckets.length > 1 ? monthBuckets[1].id : monthBuckets[0].id),
      };

      if (
        next.sourceBucketId === prev.sourceBucketId &&
        next.targetBucketId === prev.targetBucketId
      ) {
        return prev;
      }

      return next;
    });
  }, [monthBuckets]);

  const hasRealMatrixData =
    Boolean(matrixData) && categories.length > 0 && buckets.length > 0 && cellMap.size > 0;

  const handleCloneSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!cloneForm.sourceBucketId || !cloneForm.targetBucketId) {
        setActionMessage("Selecciona meses origen y destino");
        return;
      }

      if (cloneForm.sourceBucketId === cloneForm.targetBucketId) {
        setActionMessage("El mes origen y destino no pueden ser iguales");
        return;
      }

      setIsCloning(true);

      const result = await cloneMonthlyPlanning({
        tenantId,
        sourceBucketId: cloneForm.sourceBucketId,
        targetBucketId: cloneForm.targetBucketId,
      });

      if (isFailure(result)) {
        setActionMessage(result.error.message);
        setIsCloning(false);
        return;
      }

      await loadMatrix();
      setActionMessage("Clonado mensual ejecutado con éxito");
      setIsCloning(false);
    },
    [cloneForm.sourceBucketId, cloneForm.targetBucketId, loadMatrix, tenantId],
  );

  const errorMessage = useMemo(() => {
    if (!matrixResult || isSuccess(matrixResult)) {
      return "";
    }

    const statusCode = getHttpStatusCode(matrixResult.error);
    return `${matrixResult.error.message} (HTTP ${statusCode})`;
  }, [matrixResult]);

  return (
    <section className="space-y-4" data-testid="matrix-container">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="text-sm font-medium text-gray-700">
            Granularidad
            <select
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
              data-testid="granularity-selector"
              value={filters.granularity}
              onChange={(event) => setGranularity(event.target.value as MatrixGranularity)}
            >
              {Object.entries(granularityLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-3" data-testid="date-range-picker">
            <label className="text-sm font-medium text-gray-700">
              Fecha inicio
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-gray-300 p-2"
                data-testid="date-range-picker-start"
                value={filters.startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-gray-700">
              Fecha fin
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-gray-300 p-2"
                data-testid="date-range-picker-end"
                value={filters.endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>

          <label className="text-sm font-medium text-gray-700">
            Entidad/Subcuenta
            <select
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
              data-testid="entity-selector"
              value={filters.entityId}
              onChange={(event) => setEntityId(event.target.value)}
            >
              {entityOptions.map((entity) => (
                <option key={entity.id || "all"} value={entity.id}>
                  {entity.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <form
        className="rounded-lg border border-gray-200 bg-white p-4"
        data-testid="clone-action"
        onSubmit={handleCloneSubmit}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-end">
          <label className="text-sm font-medium text-gray-700 md:col-span-2">
            Mes origen
            <select
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
              data-testid="clone-source-select"
              value={cloneForm.sourceBucketId}
              onChange={(event) =>
                setCloneForm((prev) => ({ ...prev, sourceBucketId: event.target.value }))
              }
            >
              {monthBuckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>
                  {bucket.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700 md:col-span-2">
            Mes destino
            <select
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
              data-testid="clone-target-select"
              value={cloneForm.targetBucketId}
              onChange={(event) =>
                setCloneForm((prev) => ({ ...prev, targetBucketId: event.target.value }))
              }
            >
              {monthBuckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>
                  {bucket.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="clone-submit-btn"
            disabled={isCloning || monthBuckets.length === 0}
          >
            {isCloning ? "Clonando..." : "Clonar"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Cargando matriz financiera...
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {actionMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      )}

      {hasRealMatrixData && (
        <div
          className="max-h-[calc(100vh-250px)] overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm"
          data-testid="matrix-scroll-container"
          onScroll={handleScroll}
          ref={scrollContainerRef}
        >
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-50" data-testid="matrix-header-row">
              <tr>
                <th
                  className="sticky left-0 top-0 z-30 min-w-[240px] border-b border-r border-gray-200 bg-gray-50 p-3 text-left shadow-sm"
                  data-testid="matrix-category-column"
                >
                  Categorías
                </th>
                {buckets.map((bucket) => (
                  <th
                    key={bucket.id}
                    className="sticky top-0 z-20 min-w-[180px] border-b border-gray-200 bg-gray-50 p-3 text-left shadow-sm"
                    data-testid="matrix-header-cell"
                    data-bucket-id={bucket.id}
                    data-start-date={bucket.startDate}
                    data-end-date={bucket.endDate}
                  >
                    <div className="font-semibold text-gray-900">{bucket.label}</div>
                    <div className="text-xs text-gray-500">
                      {bucket.startDate} → {bucket.endDate}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedCategories.map((group) => (
                <Fragment key={`group-fragment-${group.label}`}>
                  <tr key={`group-${group.label}`}>
                    <td className="sticky left-0 z-10 border-b border-r border-gray-200 bg-slate-100 p-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>{group.label}</span>
                        <div className="flex items-center gap-2">
                          {selectCategoryGroup?.groupLabel === group.label && (
                            <select
                              className="rounded border border-gray-300 px-1 py-0.5 text-xs text-gray-700"
                              autoFocus
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  setAddedCategories(prev => [...prev, val]);
                                }
                                setSelectCategoryGroup(null);
                              }}
                              onBlur={() => setSelectCategoryGroup(null)}
                            >
                              <option value="">-- Escoger --</option>
                              {categories
                                .filter(cat => cat.type === group.type && !group.items.some(item => item.id === cat.id))
                                .map(cat => (
                                  <option key={`opt-${cat.id}`} value={cat.id}>{cat.name}</option>
                                ))
                              }
                            </select>
                          )}
                          <button 
                            className="flex items-center gap-1 rounded px-2 py-1 text-[10px] lowercase font-semibold tracking-normal text-blue-600 hover:bg-blue-100 transition-colors"
                            title={`Agregar a ${group.label}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectCategoryGroup({ groupLabel: group.label, isOpen: true });
                            }}
                          >
                            <Plus className="h-3 w-3" />
                            agregar
                          </button>
                        </div>
                      </div>
                    </td>
                    {buckets.map((bucket) => (
                      <td
                        key={`group-${group.label}-${bucket.id}`}
                        className="border-b border-gray-100 bg-slate-50 p-2"
                      />
                    ))}
                  </tr>
                  {group.items.map((category) => (
                    <tr key={category.id}>
                      <td className="sticky left-0 z-10 border-b border-r border-gray-200 bg-white p-3">
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-xs uppercase text-gray-400">{category.type}</div>
                      </td>
                      {buckets.map((bucket) => {
                        const cell = cellMap.get(`${category.id}::${bucket.id}`);

                        if (!cell) {
                          return (
                            <td
                              key={`${category.id}-${bucket.id}`}
                              className="cursor-pointer border-b border-gray-100 p-3 align-top text-xs text-gray-400 transition-colors hover:bg-gray-50"
                              data-testid="matrix-cell"
                              data-category-id={category.id}
                              data-bucket-id={bucket.id}
                              onClick={() => openCellEditor(category.id, bucket.id)}
                            >
                              <div data-testid="cell-empty">Sin registro</div>
                            </td>
                          );
                        }

                        const projected = Number(cell?.projectedAmount ?? 0);
                        const real = Number(cell?.realAmount ?? 0);
                        const isExecuted = real > 0;
                        const isPlanned = projected > 0 && !isExecuted;
                        const isOverBudget = Boolean(cell?.isOverBudget);

                        return (
                          <td
                            key={`${category.id}-${bucket.id}`}
                            className={`cursor-pointer border-b border-gray-100 p-3 align-top transition-colors hover:bg-gray-50 ${
                              isOverBudget ? "bg-red-50" : ""
                            }`}
                            data-testid="matrix-cell"
                            data-category-id={category.id}
                            data-bucket-id={bucket.id}
                            onClick={() => openCellEditor(category.id, bucket.id)}
                          >
                            <div
                              data-testid="cell-style"
                              className={`space-y-1 ${
                                isPlanned ? "cell-planned text-gray-500 italic" : ""
                              } ${isExecuted ? "cell-executed text-gray-900 font-bold" : ""} ${
                                isOverBudget ? "cell-over-budget" : ""
                              }`}
                            >
                              <div data-testid="cell-value">Proyectado: {formatMoney(cell.projectedAmount)}</div>
                              <div>Real: {formatMoney(cell.realAmount)}</div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {matrixData && !hasRealMatrixData && (
        <div
          className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600"
          data-testid="matrix-empty-state"
        >
          No hay datos financieros reales para el rango seleccionado.
        </div>
      )}

      {activeCell && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 p-4"
          onClick={closeCellEditor}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl"
            data-testid="quick-entry-popover"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Quick entry</h3>

            <div data-testid="quick-entry-form">
              <label className="mb-3 block text-sm font-medium text-gray-700">
                Monto proyectado
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 p-2"
                  data-testid="planned-amount-input"
                  value={cellEditor.projectedAmount}
                  onChange={(event) =>
                    setCellEditor((prev) => ({ ...prev, projectedAmount: event.target.value }))
                  }
                />
              </label>

              <label className="mb-4 block text-sm font-medium text-gray-700">
                Fecha
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2"
                  value={cellEditor.paymentDate}
                  onChange={(event) =>
                    setCellEditor((prev) => ({ ...prev, paymentDate: event.target.value }))
                  }
                />
              </label>

              <label className="mb-4 block text-sm font-medium text-gray-700">
                Monto real (Pago / Ingreso)
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 p-2"
                  data-testid="payment-amount-input"
                  value={cellEditor.paymentAmount}
                  placeholder="0.00"
                  onChange={(event) =>
                    setCellEditor((prev) => ({ ...prev, paymentAmount: event.target.value }))
                  }
                />
              </label>

              <label className="mb-4 block text-sm font-medium text-gray-700">
                Descripción / Notas
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 p-2"
                  data-testid="payment-description-input"
                  placeholder="Ej. Pago de Juan, Nómina, etc."
                  value={cellEditor.description}
                  onChange={(event) =>
                    setCellEditor((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-md bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-900 disabled:opacity-50"
                data-testid="save-cell-btn"
                disabled={isSavingCell}
                onClick={() => {
                  void handleSaveProjectedAmount();
                }}
              >
                {isSavingCell ? "Guardando..." : "Guardar Proyectado"}
              </button>

              <button
                className="rounded-md bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
                data-testid="mark-paid-btn"
                disabled={isPayingCell}
                onClick={() => {
                  void handleMarkPaid();
                }}
              >
                {isPayingCell ? "Aplicando..." : "Pagar"}
              </button>

              <button
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                data-testid="cancel-cell-btn"
                onClick={closeCellEditor}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export const FinancialMatrixBoard = memo(FinancialMatrixBoardComponent);
