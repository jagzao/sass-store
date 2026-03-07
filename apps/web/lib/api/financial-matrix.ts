import { getApiUrl } from "@/lib/api/client-config";
import {
  Result,
  Ok,
  Err,
  fromPromise,
  isFailure,
} from "@sass-store/core/src/result";
import {
  DomainError,
  ErrorFactories,
} from "@sass-store/core/src/errors/types";

export type MatrixGranularity = "week" | "fortnight" | "month" | "year";

export interface DateBucket {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isPartial: boolean;
}

export interface MatrixCategory {
  id: string;
  type: "income" | "expense";
  name: string;
  color: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  isGroup: boolean;
}

export interface MatrixCell {
  categoryId: string;
  bucketId: string;
  projectedAmount: string;
  realAmount: string;
  isOverBudget: boolean;
  movementCount: number;
}

export interface MatrixData {
  tenantId: string;
  granularity: MatrixGranularity;
  dateRange: {
    start: string;
    end: string;
  };
  timeBuckets: DateBucket[];
  categories: MatrixCategory[];
  cells: MatrixCell[];
  totals: {
    income: { projected: string; real: string };
    expense: { projected: string; real: string };
    net: string;
  };
  metadata: {
    currency: string;
    timezone: string;
    generatedAt: string;
  };
}

export interface MatrixLoadFilters {
  tenantId: string;
  granularity: MatrixGranularity;
  startDate: string;
  endDate: string;
  entityId?: string;
}

export interface MatrixUpsertCellPayload {
  tenantId: string;
  categoryId: string;
  granularity: MatrixGranularity;
  bucketId: string;
  bucketStartDate: string;
  bucketEndDate: string;
  projectedAmount: string;
  entityId?: string;
  notes?: string;
}

export interface MatrixMarkPaidPayload {
  tenantId: string;
  categoryId: string;
  amount: string;
  fechaProgramada: string;
  fechaPago?: string;
  entityId?: string;
  description?: string;
}

export interface MatrixClonePayload {
  tenantId: string;
  sourceBucketId: string;
  targetBucketId: string;
  categoryIds?: string[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    message?: string;
    type?: string;
    details?: unknown;
  };
}

const asApiUrl = (path: string): string => `${getApiUrl()}${path}`;

const asDomainError = (
  operation: string,
  fallbackMessage: string,
  statusCode: number,
  error?: ApiEnvelope<unknown>["error"],
): DomainError => {
  if (statusCode === 400) {
    return ErrorFactories.validation(
      error?.message || fallbackMessage,
      operation,
      undefined,
      error?.details,
    );
  }

  if (statusCode === 403) {
    return ErrorFactories.authorization(error?.message || fallbackMessage, operation);
  }

  if (statusCode === 404) {
    return ErrorFactories.notFound("Resource", operation, error?.details);
  }

  return ErrorFactories.network(
    error?.message || fallbackMessage,
    operation,
    statusCode,
  );
};

const parseApiEnvelope = async <T>(
  response: Response,
  operation: string,
): Promise<Result<T, DomainError>> => {
  const jsonResult = await fromPromise(response.json() as Promise<ApiEnvelope<T>>, (error) =>
    ErrorFactories.network(
      `Invalid API JSON payload on ${operation}`,
      operation,
      response.status,
      error as Error,
    ),
  );

  if (isFailure(jsonResult)) {
    return jsonResult;
  }

  const body = jsonResult.data;

  if (!response.ok || !body.success || typeof body.data === "undefined") {
    return Err(
      asDomainError(
        operation,
        `API error on ${operation}`,
        response.status,
        body.error,
      ),
    );
  }

  return Ok(body.data);
};

const postJson = async <TResponse, TPayload>(
  path: string,
  method: "POST" | "PUT" | "PATCH",
  payload: TPayload,
  operation: string,
): Promise<Result<TResponse, DomainError>> => {
  const responseResult = await fromPromise(
    fetch(asApiUrl(path), {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    (error) =>
      ErrorFactories.network(
        `Failed to call ${operation}`,
        operation,
        undefined,
        error as Error,
      ),
  );

  if (isFailure(responseResult)) {
    return responseResult;
  }

  return parseApiEnvelope<TResponse>(responseResult.data, operation);
};

export const fetchFinancialMatrix = async (
  filters: MatrixLoadFilters,
): Promise<Result<MatrixData, DomainError>> => {
  const search = new URLSearchParams({
    tenantId: filters.tenantId,
    granularity: filters.granularity,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  if (filters.entityId) {
    search.set("entityId", filters.entityId);
  }

  const responseResult = await fromPromise(
    fetch(asApiUrl(`/api/finance/matrix?${search.toString()}`), {
      method: "GET",
      cache: "no-store",
    }),
    (error) =>
      ErrorFactories.network(
        "Failed to load financial matrix",
        "load_matrix",
        undefined,
        error as Error,
      ),
  );

  if (isFailure(responseResult)) {
    return responseResult;
  }

  return parseApiEnvelope<MatrixData>(responseResult.data, "load_matrix");
};

export const upsertMatrixCell = (
  payload: MatrixUpsertCellPayload,
): Promise<Result<unknown, DomainError>> =>
  postJson<unknown, MatrixUpsertCellPayload>(
    "/api/finance/matrix/cells",
    "PUT",
    payload,
    "upsert_matrix_cell",
  );

export const markMatrixCellPaid = (
  payload: MatrixMarkPaidPayload,
): Promise<Result<unknown, DomainError>> =>
  postJson<unknown, MatrixMarkPaidPayload>(
    "/api/finance/matrix/movements",
    "POST",
    payload,
    "mark_matrix_cell_paid",
  );

export const cloneMonthlyPlanning = (
  payload: MatrixClonePayload,
): Promise<Result<unknown, DomainError>> =>
  postJson<unknown, MatrixClonePayload>(
    "/api/finance/matrix/clone",
    "POST",
    payload,
    "clone_monthly_planning",
  );

export const fetchTenantBySlug = async (
  tenantSlug: string,
): Promise<Result<{ id: string; name: string }, DomainError>> => {
  const responseResult = await fromPromise(
    fetch(`/api/tenants/${tenantSlug}`, {
      method: "GET",
      cache: "no-store",
    }),
    (error) =>
      ErrorFactories.network(
        "Failed to load tenant data",
        "load_tenant",
        undefined,
        error as Error,
      ),
  );

  if (isFailure(responseResult)) {
    return responseResult;
  }

  const response = responseResult.data;

  const jsonResult = await fromPromise(response.json() as Promise<Record<string, unknown>>, (error) =>
    ErrorFactories.network(
      "Invalid tenant payload",
      "load_tenant",
      response.status,
      error as Error,
    ),
  );

  if (isFailure(jsonResult)) {
    return jsonResult;
  }

  if (!response.ok) {
    return Err(
      ErrorFactories.network(
        "Tenant request failed",
        "load_tenant",
        response.status,
      ),
    );
  }

  const id = jsonResult.data.id;
  const name = jsonResult.data.name;

  if (typeof id !== "string" || typeof name !== "string") {
    return Err(
      ErrorFactories.validation(
        "Tenant payload does not include id/name",
        "load_tenant",
      ),
    );
  }

  return Ok({ id, name });
};
