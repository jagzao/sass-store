import { useState, useEffect, useCallback, useRef } from "react";

export interface UseFormPersistOptions<T> {
  key: string; // Unique key for localStorage
  initialValues: T;
  ttl?: number; // Time to live in milliseconds (default: 24h)
  debounceMs?: number; // Debounce delay (default: 500ms)
  excludeFields?: (keyof T)[]; // Fields to exclude from persistence (e.g., passwords)
}

export interface UseFormPersistReturn<T> {
  values: T;
  setValues: (values: T) => void;
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
  clearPersistedData: () => void;
  hasDraft: boolean;
  isRestored: boolean;
}

interface PersistedData<T> {
  data: T;
  timestamp: number;
}

const STORAGE_PREFIX = "form_draft_";
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_DEBOUNCE = 500; // 500ms

export function useFormPersist<T extends Record<string, unknown>>({
  key,
  initialValues,
  ttl = DEFAULT_TTL,
  debounceMs = DEFAULT_DEBOUNCE,
  excludeFields = [],
}: UseFormPersistOptions<T>): UseFormPersistReturn<T> {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const [values, setValuesState] = useState<T>(initialValues);
  const [hasDraft, setHasDraft] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Load persisted data on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        setIsRestored(true);
        return;
      }

      const parsed: PersistedData<T> = JSON.parse(stored);
      const now = Date.now();

      // Check if data has expired
      if (now - parsed.timestamp > ttl) {
        localStorage.removeItem(storageKey);
        setIsRestored(true);
        return;
      }

      // Restore data
      setValuesState(parsed.data);
      setHasDraft(true);
      setIsRestored(true);
    } catch (error) {
      console.error("[useFormPersist] Error loading persisted data:", error);
      localStorage.removeItem(storageKey);
      setIsRestored(true);
    }
  }, [storageKey, ttl]);

  // Persist data to localStorage with debounce
  const persistData = useCallback(
    (data: T) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        try {
          // Filter out excluded fields
          const dataToPersist = { ...data };
          excludeFields.forEach((field) => {
            delete dataToPersist[field];
          });

          const toStore: PersistedData<T> = {
            data: dataToPersist,
            timestamp: Date.now(),
          };

          localStorage.setItem(storageKey, JSON.stringify(toStore));
          setHasDraft(true);
        } catch (error) {
          console.error("[useFormPersist] Error persisting data:", error);
        }
      }, debounceMs);
    },
    [storageKey, debounceMs, excludeFields],
  );

  // Update values and persist
  const setValues = useCallback(
    (newValues: T) => {
      setValuesState(newValues);
      if (isInitializedRef.current) {
        persistData(newValues);
      }
    },
    [persistData],
  );

  const setFieldValue = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValuesState((prev) => {
        const updated = {
          ...prev,
          [field]: value,
        };
        if (isInitializedRef.current) {
          persistData(updated);
        }
        return updated;
      });
    },
    [persistData],
  );

  // Clear persisted data
  const clearPersistedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);

      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    } catch (error) {
      console.error("[useFormPersist] Error clearing persisted data:", error);
    }
  }, [storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    values,
    setValues,
    setFieldValue,
    clearPersistedData,
    hasDraft,
    isRestored,
  };
}
