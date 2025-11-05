'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '../error-boundary';
import { Button } from '@sass-store/ui';

interface CartErrorBoundaryProps {
  children: ReactNode;
}

export function CartErrorBoundary({ children }: CartErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log cart-specific errors
        console.error('[Cart Error]:', error);
        console.error('[Cart Error Info]:', errorInfo);

        // TODO: Send to analytics/monitoring
        // analytics.track('cart_error', {
        //   error: error.message,
        //   stack: error.stack,
        //   componentStack: errorInfo.componentStack,
        // });
      }}
      fallback={
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-600"
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
            <div className="flex-1">
              <h3 className="font-medium text-red-900 mb-1">
                Error en el carrito
              </h3>
              <p className="text-sm text-red-700 mb-3">
                Hubo un problema al cargar tu carrito. Tus productos están seguros.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Recargar página
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.location.href = '/'}
                >
                  Ir al inicio
                </Button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
