/**
 * useInventoryAlerts Hook with Result Pattern
 *
 * Migrated to use Result pattern for consistent error handling
 */

"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

// Import Result pattern utilities
import {
  Result,
  Ok,
  Err,
  isSuccess,
  isFailure,
} from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export interface InventoryAlert {
  id: string;
  tenantId: string;
  productId: string;
  alertType: string;
  message: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  acknowledgedNotes?: string;
  metadata?: Record<string, any>;
}

export interface AcknowledgeAlertData {
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedNotes?: string;
}

export interface UseInventoryAlertsOptions {
  autoFetch?: boolean;
  productId?: string;
  alertType?: string;
  isAcknowledged?: boolean;
}

export interface UseInventoryAlertsReturn {
  alerts: InventoryAlert[];
  isLoading: boolean;
  error: DomainError | null;
  refresh: () => void;
  acknowledge: (alertId: string, data: AcknowledgeAlertData) => Promise<void>;
}

/**
 * useInventoryAlerts Hook with Result Pattern
 */
export function useInventoryAlerts(
  options: UseInventoryAlertsOptions = {},
): UseInventoryAlertsReturn {
  const { autoFetch = true, productId, alertType, isAcknowledged } = options;
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<DomainError | null>(null);
  const { toast } = useToast();

  // Fetch inventory alerts with Result pattern
  const fetchInventoryAlerts = useCallback(async (): Promise<
    Result<InventoryAlert[], DomainError>
  > => {
    try {
      const params = new URLSearchParams();
      if (productId) params.append("productId", productId);
      if (alertType) params.append("alertType", alertType);
      if (isAcknowledged !== undefined)
        params.append("isAcknowledged", isAcknowledged.toString());

      const response = await fetch(
        `/api/inventory/alerts?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        return Err(
          ErrorFactories.network(
            `Failed to fetch inventory alerts: ${response.status}`,
            "fetch_inventory_alerts",
            response.status,
          ),
        );
      }

      const data = await response.json();

      if (!data.success) {
        return Err(
          ErrorFactories.database(
            "Invalid response from inventory alerts API",
            "fetch_inventory_alerts",
            undefined,
            data.error,
          ),
        );
      }

      return Ok(data.data);
    } catch (err) {
      return Err(
        ErrorFactories.database(
          "Failed to fetch inventory alerts",
          "fetch_inventory_alerts",
          undefined,
          err instanceof Error ? err : undefined,
        ),
      );
    }
  }, [productId, alertType, isAcknowledged]);

  // Acknowledge alert with Result pattern
  const acknowledgeAlert = useCallback(
    async (
      alertId: string,
      data: AcknowledgeAlertData,
    ): Promise<Result<void, DomainError>> => {
      try {
        const response = await fetch(
          `/api/inventory/alerts/${alertId}/acknowledge`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          },
        );

        if (!response.ok) {
          return Err(
            ErrorFactories.network(
              `Failed to acknowledge alert: ${response.status}`,
              "acknowledge_alert",
              response.status,
            ),
          );
        }

        const result = await response.json();

        if (!result.success) {
          return Err(
            ErrorFactories.database(
              "Invalid response from acknowledge API",
              "acknowledge_alert",
              undefined,
              result.error,
            ),
          );
        }

        // Update local state
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId
              ? { ...alert, ...data, isAcknowledged: data.isAcknowledged }
              : alert,
          ),
        );

        toast.success("Alert acknowledged successfully");
        return Ok(undefined);
      } catch (err) {
        return Err(
          ErrorFactories.database(
            "Failed to acknowledge alert",
            "acknowledge_alert",
            undefined,
            err instanceof Error ? err : undefined,
          ),
        );
      }
    },
    [],
  );

  // Load data with Result pattern
  const loadInventoryAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchInventoryAlerts();

    if (isSuccess(result)) {
      setAlerts(result.data);
      setIsLoading(false);
    } else {
      setError(result.error);
      setIsLoading(false);
      toast.error("Failed to load inventory alerts");
    }
  }, [fetchInventoryAlerts]);

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch) {
      loadInventoryAlerts();
    }
  }, [autoFetch, loadInventoryAlerts]);

  return {
    alerts,
    isLoading,
    error,
    refresh: loadInventoryAlerts,
    acknowledge: acknowledgeAlert,
  };
}
