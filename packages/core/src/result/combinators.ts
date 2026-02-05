/**
 * Result Combinators and Helpers
 *
 * Additional utilities for working with Results, including:
 * - Advanced combinators
 * - Array operations
 * - Utility functions
 * - Performance helpers
 */

import { Result, Ok, Err, match, isFailure, map } from "./index";
import { DomainError, ErrorFactories, toDomainError } from "../errors/types";

// Combine multiple Results and collect all errors
export const combineAll = <T, E>(
  ...results: Result<T, E>[]
): Result<T[], E[]> => {
  const successes: T[] = [];
  const errors: E[] = [];

  for (const result of results) {
    if (result.success) {
      successes.push(result.data);
    } else {
      errors.push((result as { success: false; error: E }).error);
    }
  }

  return errors.length > 0 ? Err(errors) : Ok(successes);
};

// Combine Results but only keep first error
export const combineFirstError = <T, E>(
  ...results: Result<T, E>[]
): Result<T[], E> => {
  const successes: T[] = [];

  for (const result of results) {
    if (result.success) {
      successes.push(result.data);
    } else {
      return result as Result<T[], E>;
    }
  }

  return Ok(successes);
};

// Parallel execution with Result handling
export const parallel = <T, E>(
  ...promises: Promise<Result<T, E>>[]
): Promise<Result<T[], E[]>> => {
  return Promise.all(promises).then((results) => combineAll(...results));
};

// Race operations - return first successful result or first error if all fail
export const race = async <T, E>(
  ...promises: Promise<Result<T, E>>[]
): Promise<Result<T, E>> => {
  const errors: E[] = [];

  for (const promise of promises) {
    try {
      const result = await promise;
      if (result.success) {
        return result;
      }
      errors.push((result as { success: false; error: E }).error);
    } catch (error) {
      errors.push(toDomainError(error) as E);
    }
  }

  return Err(errors.length === 1 ? errors[0] : (errors as any));
};

// Retry mechanism for async operations
export const retry = async <T, E>(
  operation: () => Promise<Result<T, E>>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    shouldRetry?: (error: E) => boolean;
  } = {},
): Promise<Result<T, E>> => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: E;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await operation();

    if (result.success) {
      return result;
    }

    lastError = (result as { success: false; error: E }).error;

    // Don't retry on last attempt or if shouldn't retry
    if (attempt === maxAttempts || !shouldRetry(lastError)) {
      return result;
    }

    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, currentDelay));
    currentDelay *= backoff;
  }

  return Err(lastError!);
};

// Timeout for async operations
export const withTimeout = async <T, E>(
  operation: Promise<Result<T, E>>,
  timeoutMs: number,
  timeoutError: E,
): Promise<Result<T, E>> => {
  const timeoutPromise = new Promise<Result<T, E>>((_, reject) => {
    setTimeout(() => reject(timeoutError), timeoutMs);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } catch (error) {
    return Err(error as E);
  }
};

// Cache Results with TTL
export class ResultCache<K, T, E> {
  private cache = new Map<
    string,
    { result: Result<T, E>; timestamp: number }
  >();
  private ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.ttl = ttlMs;
  }

  private getKey(key: K): string {
    return JSON.stringify(key);
  }

  get(key: K): Result<T, E> | null {
    const cacheKey = this.getKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry || Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.result;
  }

  set(key: K, result: Result<T, E>): void {
    const cacheKey = this.getKey(key);
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Get or compute with caching
  async getOrCompute(
    key: K,
    compute: () => Promise<Result<T, E>>,
  ): Promise<Result<T, E>> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = await compute();
    this.set(key, result);
    return result;
  }
}

// Batch operations
export const batch = async <T, E, R>(
  items: T[],
  operation: (item: T) => Promise<Result<R, E>>,
  options: {
    stopOnFirstError?: boolean;
    parallel?: boolean;
  } = {},
): Promise<Result<R[], E[]>> => {
  const { stopOnFirstError = false, parallel = false } = options;

  if (parallel) {
    const promises = items.map((item) => operation(item));
    const results = await Promise.all(promises);

    const successes: R[] = [];
    const errors: E[] = [];

    for (const result of results) {
      if (result.success) {
        successes.push(result.data);
      } else {
        errors.push((result as { success: false; error: E }).error);
        if (stopOnFirstError) {
          break;
        }
      }
    }

    return errors.length > 0 ? Err(errors) : Ok(successes);
  } else {
    const successes: R[] = [];
    const errors: E[] = [];

    for (const item of items) {
      const result = await operation(item);

      if (result.success) {
        successes.push(result.data);
      } else {
        errors.push((result as { success: false; error: E }).error);
        if (stopOnFirstError) {
          return Err(errors);
        }
      }
    }

    return errors.length > 0 ? Err(errors) : Ok(successes);
  }
};

// Utility to convert arrays to Results
export const fromArray = <T, E>(
  array: T[],
  validator: (item: T) => Result<T, E>,
): Result<T[], E> => {
  const results = array.map(validator);
  return combineFirstError(...results);
};

// Validation utilities
export const validateObject = <T extends Record<string, any>, E>(
  obj: T,
  schema: { [K in keyof T]: (value: T[K]) => Result<T[K], E> },
): Result<T, E> => {
  const entries = Object.entries(schema) as [
    keyof T,
    (value: any) => Result<any, E>,
  ][];
  const results = entries.map(([key, validator]) => {
    const result = validator(obj[key]);
    return result.success
      ? Ok({ [key]: result.data } as Partial<T>)
      : (result as Result<Partial<T>, E>);
  });

  const combinedResult = combineFirstError(...results);
  if (!combinedResult.success) {
    return combinedResult as Result<T, E>;
  }

  return Ok(Object.assign({}, ...combinedResult.data) as T);
};

// Async validation
export const validateObjectAsync = async <T extends Record<string, any>, E>(
  obj: T,
  schema: { [K in keyof T]: (value: T[K]) => Promise<Result<T[K], E>> },
): Promise<Result<T, E>> => {
  const entries = Object.entries(schema) as [
    keyof T,
    (value: any) => Promise<Result<any, E>>,
  ][];
  const promises = entries.map(async ([key, validator]) => {
    const result = await validator(obj[key]);
    return result.success
      ? Ok({ [key]: result.data } as Partial<T>)
      : (result as Result<Partial<T>, E>);
  });

  const results = await Promise.all(promises);
  const combinedResult = combineFirstError(...results);
  if (!combinedResult.success) {
    return combinedResult as Result<T, E>;
  }

  return Ok(Object.assign({}, ...combinedResult.data) as T);
};

// Performance monitoring wrapper
export const withPerformanceTracking = <T, E>(
  operation: () => Result<T, E> | Promise<Result<T, E>>,
  options: {
    name?: string;
    onSlow?: (duration: number) => void;
    threshold?: number;
  } = {},
) => {
  const { name = "Operation", onSlow, threshold = 1000 } = options;

  return async () => {
    const start = performance.now();
    const result = await Promise.resolve(operation());
    const duration = performance.now() - start;

    if (duration > threshold && onSlow) {
      onSlow(duration);
    }

    console.debug(`${name} completed in ${duration.toFixed(2)}ms`);
    return result;
  };
};

// Resource management with automatic cleanup
export const withResource = async <T, R, E>(
  resource: T,
  operation: (resource: T) => Promise<Result<R, E>>,
  cleanup: (resource: T) => Promise<void> | void,
): Promise<Result<R, E>> => {
  try {
    const result = await operation(resource);
    await cleanup(resource);
    return result;
  } catch (error) {
    await cleanup(resource);
    throw error;
  }
};

// Logger for Results
export const logResult = <T, E>(
  result: Result<T, E>,
  logger: {
    info: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
  },
  operation: string,
): Result<T, E> => {
  return match(result, {
    ok: (data) => {
      logger.info(`${operation} succeeded`, { data });
      return result;
    },
    err: (error) => {
      logger.error(`${operation} failed`, error);
      return result;
    },
  });
};

// Type assertion for Result (useful for testing)
export const expectSuccess = <T, E>(result: Result<T, E>): T => {
  if (!result.success) {
    throw new Error(
      `Expected success but got error: ${JSON.stringify((result as { success: false; error: E }).error)}`,
    );
  }
  return result.data;
};

export const expectFailure = <T, E>(result: Result<T, E>): E => {
  if (result.success) {
    throw new Error(
      `Expected failure but got success: ${JSON.stringify(result.data)}`,
    );
  }
  return (result as { success: false; error: E }).error;
};
