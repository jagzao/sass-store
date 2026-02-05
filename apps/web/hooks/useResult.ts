/**
 * useResult Hook
 *
 * Custom hook for handling Result objects in React components
 * Provides loading, error, and data states with automatic retry and caching
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Result, isSuccess, isFailure, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

interface UseResultOptions<T, E extends DomainError> {
  result: Result<T, E> | Promise<Result<T, E>>;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: E) => void;
  cacheKey?: string;
  cacheTime?: number;
}

interface UseResultReturn<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: DomainError | null;
  retry: () => void;
  reset: () => void;
}

/**
 * useResult Hook
 *
 * Manages Result state with loading, error handling, and optional retry logic
 */
export function useResult<T, E extends DomainError>({
  result,
  autoRetry = false,
  maxRetries = 3,
  retryDelay = 1000,
  onSuccess,
  onError,
  cacheKey,
  cacheTime = 5 * 60 * 1000, // 5 minutes
}: UseResultOptions<T, E>): UseResultReturn<T, E> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<E | null>(null);
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
    async (res: Result<T, E>) => {
      setIsLoading(true);
      setError(null);

      try {
        if (isSuccess(res)) {
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
          throw res.error;
        }
      } catch (err) {
        const error = err as E;
        setError(error);
        setIsLoading(false);

        if (onError) {
          onError(error);
        }

        // Auto retry logic
        if (autoRetry && retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          setTimeout(() => {
            processResult(res); // Retry with original result
          }, retryDelay * retryCount);
        }
      }
    },
    [
      autoRetry,
      maxRetries,
      retryDelay,
      onSuccess,
      onError,
      cacheKey,
      saveCache,
    ],
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
      if (result instanceof Promise) {
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
export function useAsyncResult<T, E extends DomainError>(
  asyncOperation: () => Promise<Result<T, E>>,
  options: {
    autoExecute?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: E) => void;
    dependencies?: any[];
  } = {},
) {
  const { autoExecute = true, onSuccess, onError, dependencies = [] } = options;
  const [result, setResult] = useState<Result<T, E> | null>(null);

  const execute = useCallback(async () => {
    try {
      const res = await asyncOperation();
      setResult(res);

      if (isSuccess(res)) {
        if (onSuccess) onSuccess(res.data);
      } else {
        if (onError) onError(res.error);
      }
    } catch (err) {
      const error = ErrorFactories.database(
        "async_operation_failed",
        "Async operation failed",
        undefined,
        err instanceof Error ? err : undefined,
      );
      const errorResult: Result<T, DomainError> = Err(error);
      setResult(errorResult);

      if (onError) onError(error);

      if (onError) onError(error);
    }
  }, [asyncOperation, onSuccess, onError]);

  useEffect(() => {
    if (autoExecute) {
      execute();
    }
  }, [execute, autoExecute, dependencies]);

  return {
    ...useResult(result!, { onSuccess, onError }),
    execute,
  };
}
