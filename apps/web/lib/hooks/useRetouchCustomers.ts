"use client";

import { useState, useEffect } from "react";

interface RetouchCustomer {
  id: string;
  name: string;
  phone: string;
  nextRetouchDate: string | null;
  daysUntilRetouch: number | null;
}

interface UseRetouchCustomersOptions {
  limit?: number;
  offset?: number;
}

interface UseRetouchCustomersReturn {
  customers: RetouchCustomer[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRetouchCustomers(
  options: UseRetouchCustomersOptions = {},
): UseRetouchCustomersReturn {
  const { limit = 50, offset = 0 } = options;
  const [customers, setCustomers] = useState<RetouchCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/retouch/customers?limit=${limit}&offset=${offset}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setCustomers(data.data);
      } else {
        setError(data.error || "Failed to fetch customers");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [limit, offset]);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
  };
}
