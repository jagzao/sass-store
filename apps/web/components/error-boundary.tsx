"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@sass-store/ui";
import { FeedbackErrorTrigger } from "@/components/feedback/FeedbackErrorTrigger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send to error tracking service (Sentry)
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error, {
          extra: {
            componentStack: errorInfo.componentStack,
          },
        });
      });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary if resetKeys change
    if (
      hasError &&
      resetKeys &&
      prevProps.resetKeys &&
      resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])
    ) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full bg-card text-card-foreground rounded-lg shadow-lg p-8 border border-border">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-destructive/20 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-center text-card-foreground mb-2">
              Algo salió mal
            </h1>

            <p className="text-center text-muted-foreground mb-6">
              Lo sentimos, ocurrió un error inesperado. Por favor intenta
              recargar la página.
            </p>

            {process.env.NODE_ENV === "development" && error && (
              <details className="mb-6 p-4 bg-muted rounded border border-border">
                <summary className="cursor-pointer font-medium text-sm text-muted-foreground mb-2">
                  Detalles del error (solo desarrollo)
                </summary>
                <div className="mt-2 text-xs font-mono text-destructive overflow-auto max-h-40">
                  <p className="font-bold">{error.toString()}</p>
                  {errorInfo && (
                    <pre className="mt-2 text-muted-foreground whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <Button onClick={this.reset} variant="outline" className="flex-1">
                Reintentar
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                className="flex-1"
              >
                Ir al inicio
              </Button>
            </div>

            {error && (
              <div className="mt-6 flex justify-center">
                <FeedbackErrorTrigger error={error} />
              </div>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

// Component-level error boundary for smaller sections
export function ComponentErrorBoundary({
  children,
  componentName = "Component",
}: {
  children: ReactNode;
  componentName?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Error al cargar {componentName}. Por favor intenta de nuevo.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
