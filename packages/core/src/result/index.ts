/**
 * Result Pattern Implementation
 *
 * Provides functional error handling with type safety and composability.
 * This replaces traditional try/catch with a more explicit, composable approach.
 */

// Base Result type with discriminated union
export interface ResultSuccess<T> {
  readonly success: true;
  readonly data: T;
}

export interface ResultFailure<E> {
  readonly success: false;
  readonly error: E;
}

export type Result<T, E = Error> = ResultSuccess<T> | ResultFailure<E>;

// Type guards
export const isSuccess = <T, E>(
  result: Result<T, E>,
): result is ResultSuccess<T> => result.success;

export const isFailure = <T, E>(
  result: Result<T, E>,
): result is ResultFailure<E> => !result.success;

// Constructor functions
export const Ok = <T>(data: T): ResultSuccess<T> => ({ success: true, data });

export const Err = <E>(error: E): ResultFailure<E> => ({
  success: false,
  error,
});

// Pattern matching
export const match = <T, E, R>(
  result: Result<T, E>,
  patterns: {
    ok: (data: T) => R;
    err: (error: E) => R;
  },
): R =>
  result.success
    ? patterns.ok(result.data)
    : patterns.err((result as ResultFailure<E>).error);

// Map: Transform the success value
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U,
): Result<U, E> =>
  result.success ? Ok(fn(result.data)) : (result as ResultFailure<E>);

// FlatMap: Chain operations that might fail
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>,
): Result<U, E> =>
  result.success ? fn(result.data) : (result as ResultFailure<E>);

// MapError: Transform the error value
export const mapError = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> =>
  result.success
    ? (result as ResultSuccess<T>)
    : Err(fn((result as ResultFailure<E>).error));

// Async versions
export const asyncMap = async <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Promise<U>,
): Promise<Result<U, E>> =>
  result.success ? Ok(await fn(result.data)) : (result as ResultFailure<E>);

export const asyncFlatMap = async <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Promise<Result<U, E>>,
): Promise<Result<U, E>> =>
  result.success ? await fn(result.data) : (result as ResultFailure<E>);

// Convert promises to Results
export const fromPromise = async <T, E = Error>(
  promise: Promise<T>,
  onError?: (error: unknown) => E,
): Promise<Result<T, E>> => {
  try {
    const data = await promise;
    return Ok(data);
  } catch (error) {
    return Err(onError ? onError(error) : (error as E));
  }
};

// Convert synchronous functions to Results
export const fromThrowable = <T, E = Error>(
  fn: () => T,
  onError?: (error: unknown) => E,
): Result<T, E> => {
  try {
    return Ok(fn());
  } catch (error) {
    return Err(onError ? onError(error) : (error as E));
  }
};

// Get value with fallback
export const getOrElse = <T, E>(result: Result<T, E>, fallback: T): T =>
  result.success ? result.data : fallback;

// Get value with lazy fallback
export const getOrCompute = <T, E>(
  result: Result<T, E>,
  fallback: () => T,
): T => (result.success ? result.data : fallback());

// Extract error or undefined
export const getError = <T, E>(result: Result<T, E>): E | undefined =>
  result.success ? undefined : (result as ResultFailure<E>).error;

// Convert to Either-like tuple
export const toTuple = <T, E>(result: Result<T, E>): [T | null, E | null] =>
  result.success
    ? [result.data, null]
    : [null, (result as ResultFailure<E>).error];

// Tap for side effects
export const tap = <T, E>(
  result: Result<T, E>,
  sideEffect: (data: T) => void,
): Result<T, E> => {
  if (result.success) {
    sideEffect(result.data);
  }
  return result;
};

// TapError for error side effects
export const tapError = <T, E>(
  result: Result<T, E>,
  sideEffect: (error: E) => void,
): Result<T, E> => {
  if (!result.success) {
    sideEffect((result as ResultFailure<E>).error);
  }
  return result;
};

// Chainable operations
export const pipe = <T, E>(result: Result<T, E>) => ({
  map: <U>(fn: (data: T) => U) => pipe(map(result, fn)),
  flatMap: <U>(fn: (data: T) => Result<U, E>) => pipe(flatMap(result, fn)),
  mapError: <F>(fn: (error: E) => F) => pipe(mapError(result, fn)),
  catch: <F>(fn: (error: E) => Result<T, F>) =>
    pipe(
      result.success
        ? (result as Result<T, F>)
        : fn((result as ResultFailure<E>).error),
    ),
  getOrElse: (fallback: T) => getOrElse(result, fallback),
  match: <R>(patterns: { ok: (data: T) => R; err: (error: E) => R }) =>
    match(result, patterns),
});

// Utility for conditional Results
export const fromCondition = <T, E>(
  condition: boolean,
  successValue: T,
  errorValue: E,
): Result<T, E> => (condition ? Ok(successValue) : Err(errorValue));

// Validate with predicate
export const validate = <T, E>(
  value: T,
  predicate: (value: T) => boolean,
  error: E,
): Result<T, E> => (predicate(value) ? Ok(value) : Err(error));

// Testing utilities
export const expectSuccess = <T>(result: Result<T, unknown>): T => {
  if (!result.success) {
    throw new Error(`Expected success but got error: ${(result as any).error}`);
  }
  return result.data;
};

export const expectFailure = <E>(result: Result<unknown, E>): E => {
  if (result.success) {
    throw new Error(`Expected error but got success: ${(result as any).data}`);
  }
  return (result as any).error;
};
