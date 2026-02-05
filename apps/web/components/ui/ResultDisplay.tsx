/**
 * ResultDisplay Component
 *
 * Displays Result objects with appropriate UI states
 * Handles success, error, loading, and empty states
 */

"use client";

import React from "react";
import { Result } from "@sass-store/core/src/result";
import { DomainError } from "@sass-store/core/src/errors/types";

interface ResultDisplayProps<T, E extends DomainError> {
  result: Result<T, E>;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  className?: string;
  onSuccess?: (data: T) => React.ReactNode;
  onError?: (error: E) => React.ReactNode;
  onEmpty?: () => React.ReactNode;
}

/**
 * Generic Result Display Component
 */
export function ResultDisplay<T, E extends DomainError>({
  result,
  children,
  fallback,
  loading = false,
  empty = false,
  className = "",
  onSuccess,
  onError,
  onEmpty,
}: ResultDisplayProps<T, E>) {
  // Loading state
  if (loading) {
    return (
      <div className={`result-display result-display--loading ${className}`}>
        <div className="result-display__spinner" />
        <div className="result-display__text">Loading...</div>
      </div>
    );
  }

  // Empty state
  if (empty || (result.success && !result.data)) {
    return (
      <div className={`result-display result-display--empty ${className}`}>
        {onEmpty ? (
          onEmpty()
        ) : (
          <>
            <div className="result-display__icon">📭</div>
            <div className="result-display__text">No data available</div>
          </>
        )}
      </div>
    );
  }

  // Custom children or fallback
  if (children || fallback) {
    return (
      <div className={`result-display result-display--custom ${className}`}>
        {children || fallback}
      </div>
    );
  }

  // Success state
  if (result.success) {
    return (
      <div className={`result-display result-display--success ${className}`}>
        {onSuccess ? (
          onSuccess(result.data)
        ) : (
          <>
            <div className="result-display__icon">✅</div>
            <div className="result-display__content">
              {typeof result.data === "string"
                ? result.data
                : JSON.stringify(result.data, null, 2)}
            </div>
          </>
        )}
      </div>
    );
  }

  // Error state
  return (
    <div className={`result-display result-display--error ${className}`}>
      {onError ? (
        onError(result.error)
      ) : (
        <>
          <div className="result-display__icon">❌</div>
          <div className="result-display__content">
            <div className="result-display__error-type">
              {result.error.type}
            </div>
            <div className="result-display__error-message">
              {result.error.message}
            </div>
            {result.error.details && (
              <div className="result-display__error-details">
                {JSON.stringify(result.error.details, null, 2)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Specific ResultDisplay variants
 */
interface ResultDisplaySuccessProps<T> {
  data: T;
  children?: (data: T) => React.ReactNode;
  className?: string;
}

export function ResultDisplaySuccess<T>({
  data,
  children,
  className = "",
}: ResultDisplaySuccessProps<T>) {
  return (
    <div className={`result-display result-display--success ${className}`}>
      <div className="result-display__icon">✅</div>
      <div className="result-display__content">
        {children ? children(data) : data}
      </div>
    </div>
  );
}

interface ResultDisplayErrorProps<E extends DomainError> {
  error: E;
  className?: string;
}

export function ResultDisplayError<E extends DomainError>({
  error,
  className = "",
}: ResultDisplayErrorProps<E>) {
  return (
    <div className={`result-display result-display--error ${className}`}>
      <div className="result-display__icon">❌</div>
      <div className="result-display__content">
        <div className="result-display__error-type">{error.type}</div>
        <div className="result-display__error-message">{error.message}</div>
        {error.details && (
          <div className="result-display__error-details">
            {JSON.stringify(error.details, null, 2)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ResultDisplayLoading Component
 */
interface ResultDisplayLoadingProps {
  message?: string;
  className?: string;
}

export function ResultDisplayLoading({
  message = "Loading...",
  className = "",
}: ResultDisplayLoadingProps) {
  return (
    <div className={`result-display result-display--loading ${className}`}>
      <div className="result-display__spinner" />
      <div className="result-display__text">{message}</div>
    </div>
  );
}

/**
 * ResultDisplayEmpty Component
 */
interface ResultDisplayEmptyProps {
  message?: string;
  className?: string;
}

export function ResultDisplayEmpty({
  message = "No data available",
  className = "",
}: ResultDisplayEmptyProps) {
  return (
    <div className={`result-display result-display--empty ${className}`}>
      <div className="result-display__icon">📭</div>
      <div className="result-display__text">{message}</div>
    </div>
  );
}
