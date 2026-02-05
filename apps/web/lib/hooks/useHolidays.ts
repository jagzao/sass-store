"use client";

import { useState, useEffect } from "react";

interface Holiday {
  id: string;
  date: string;
  name: string;
  recurring: boolean;
}

interface UseHolidaysReturn {
  holidays: Holiday[];
  loading: boolean;
  error: string | null;
  createHoliday: (holiday: Omit<Holiday, "id">) => Promise<void>;
  updateHoliday: (id: string, holiday: Omit<Holiday, "id">) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useHolidays(): UseHolidaysReturn {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/retouch/holidays", {
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
        setHolidays(data.data);
      } else {
        setError(data.error || "Failed to fetch holidays");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const createHoliday = async (holiday: Omit<Holiday, "id">) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/retouch/holidays", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(holiday),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        await fetchHolidays(); // Refresh the list
      } else {
        setError(data.error || "Failed to create holiday");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const updateHoliday = async (id: string, holiday: Omit<Holiday, "id">) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/retouch/holidays/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(holiday),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        await fetchHolidays(); // Refresh the list
      } else {
        setError(data.error || "Failed to update holiday");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const deleteHoliday = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/retouch/holidays/${id}`, {
        method: "DELETE",
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
        await fetchHolidays(); // Refresh the list
      } else {
        setError(data.error || "Failed to delete holiday");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  return {
    holidays,
    loading,
    error,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    refetch: fetchHolidays,
  };
}
