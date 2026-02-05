"use client";

import { useState, useEffect } from "react";

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

interface UseRetouchConfigReturn {
  configs: RetouchConfig[];
  loading: boolean;
  error: string | null;
  createOrUpdateConfig: (
    config: Omit<RetouchConfig, "id" | "serviceName">,
  ) => Promise<void>;
  refetch: () => void;
}

export function useRetouchConfig(): UseRetouchConfigReturn {
  const [configs, setConfigs] = useState<RetouchConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/retouch/config", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setConfigs(data.data);
      } else {
        setError(data.error || "Failed to fetch retouch configurations");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateConfig = async (
    config: Omit<RetouchConfig, "id" | "serviceName">,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/retouch/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        await fetchConfigs(); // Refresh the list
      } else {
        setError(data.error || "Failed to save retouch configuration");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return {
    configs,
    loading,
    error,
    createOrUpdateConfig,
    refetch: fetchConfigs,
  };
}
