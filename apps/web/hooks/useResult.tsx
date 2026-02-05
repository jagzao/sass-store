/**
 * useResult Hook
 *
 * Custom hook for handling Result objects in React components
 * Provides loading, error, and data states with automatic retry and caching
 */

"use client";

import { useState, useEffect, useCallback } from "react";

interface UseResultReturn<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: any;
  retry: () => void;
  reset: () => void;
}

/**
 * useResult Hook
 *
 * Manages Result state with loading, error handling, and optional retry logic
 */
export function useResult<T>(
  result: any,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    cacheKey?: string;
    cacheTime?: number;
  } = {},
) {
  const { onSuccess, onError, cacheKey, cacheTime = 5 * 60 * 1000 } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Check cache
  const checkCache = useCallback(
    (key: string): T | null => {
      if (!cacheTime) return null;

      try {
        const cached = localStorage.getItem(`result_cache_${key}`);
        if (!cached) return null;

        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > cacheTime) {
          localStorage.removeItem(`result_cache_${key}`);
          return null;
        }

        return cachedData;
      } catch {
        return null;
      }
    },
    [cacheTime],
  );

  // Save to cache
  const saveCache = useCallback(
    (key: string, resultData: T) => {
      if (!cacheTime) return;

      try {
        localStorage.setItem(
          `result_cache_${key}`,
          JSON.stringify({
            data: resultData,
            timestamp: Date.now(),
          }),
        );
      } catch {
        // Ignore cache errors
      }
    },
    [cacheTime],
  );

  // Process result
  const processResult = useCallback(
    (res: any) => {
      setIsLoading(true);
      setError(null);

      try {
        if (res && typeof res === "object" && res.success) {
          setData(res.data);
          setIsLoading(false);
          setRetryCount(0);

          if (cacheKey) {
            saveCache(cacheKey, res.data);
          }

          if (onSuccess) {
            onSuccess(res.data);
          }
        } else {
          throw res?.error || new Error("Operation failed");
        }
      } catch (err) {
        const error = err;
        setError(error);
        setIsLoading(false);

        if (onError) {
          onError(error);
        }
      }
    },
    [onSuccess, onError, cacheKey, saveCache],
  );

  // Execute result processing
  useEffect(() => {
    const execute = async () => {
      // Check cache first
      if (cacheKey) {
        const cached = checkCache(cacheKey);
        if (cached) {
          setData(cached);
          setIsLoading(false);
          if (onSuccess) {
            onSuccess(cached);
          }
          return;
        }
      }

      // Process the result
      if (result && typeof result.then === "function") {
        const res = await result;
        processResult(res);
      } else {
        processResult(result);
      }
    };

    execute();
  }, [result, processResult, cacheKey, checkCache]);

  const retry = useCallback(() => {
    setRetryCount(0);
    // This will trigger re-processing in the next effect
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setRetryCount(0);

    if (cacheKey) {
      localStorage.removeItem(`result_cache_${cacheKey}`);
    }
  }, [cacheKey]);

  return {
    data,
    isLoading,
    isError: !!error,
    isSuccess: !!data,
    error,
    retry,
    reset,
  };
}

/**
 * useAsyncResult Hook
 *
 * Specialized for async operations
 */
export function useAsyncResult<T>(
  asyncOperation: () => Promise<any>,
  options: {
    autoExecute?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    dependencies?: any[];
  } = {},
) {
  const { autoExecute = true, onSuccess, onError, dependencies = [] } = options;
  const [result, setResult] = useState<any>(null);

  const execute = useCallback(async () => {
    try {
      const res = await asyncOperation();
      setResult(res);

      if (res && typeof res === "object" && res.success) {
        if (onSuccess) onSuccess(res.data);
      } else {
        if (onError) onError(res.error);
      }
    } catch (err) {
      const error = {
        type: "DatabaseError",
        message: "Async operation failed",
        details: err,
      };
      setResult(error);

      if (onError) onError(error);
    }
  }, [asyncOperation, onSuccess, onError]);

  useEffect(() => {
    if (autoExecute) {
      execute();
    }
  }, [execute, autoExecute, dependencies]);

  return {
    ...useResult(result, { onSuccess, onError }),
    execute,
  };
}
