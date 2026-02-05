"use client";

import { useState } from "react";

interface UseUpdateRetouchDateReturn {
  loading: boolean;
  error: string | null;
  updateRetouchDate: (customerId: string, serviceId?: string) => Promise<void>;
}

export function useUpdateRetouchDate(): UseUpdateRetouchDateReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRetouchDate = async (customerId: string, serviceId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/retouch/customers/${customerId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ serviceId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to update retouch date");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    updateRetouchDate,
  };
}
