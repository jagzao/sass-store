'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '../error-boundary';
import { Button } from '@sass-store/ui';

interface PaymentErrorBoundaryProps {
  children: ReactNode;
}

export function PaymentErrorBoundary({ children }: PaymentErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log payment-specific errors with high priority
        console.error('[CRITICAL - Payment Error]:', error);
        console.error('[Payment Error Info]:', errorInfo);

        // TODO: Send to monitoring with high priority alert
        // Sentry.captureException(error, {
        //   level: 'error',
        //   tags: { section: 'payment' },
        //   extra: errorInfo,
        // });
      }}
      fallback={
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg border-2 border-yellow-400">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
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
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Error en el procesamiento de pago
              </h3>
              <p className="text-gray-700 mb-4">
                Ocurrió un problema al procesar tu pago. <strong>No te preocupes</strong>,
                no se realizó ningún cargo a tu tarjeta.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  ¿Qué puedes hacer?
                </h4>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  <li>Verifica que tu información de pago sea correcta</li>
                  <li>Intenta con otro método de pago</li>
                  <li>Contacta a soporte si el problema persiste</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Reintentar
                </Button>
                <Button onClick={() => window.location.href = '/cart'}>
                  Volver al carrito
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => window.location.href = '/help'}
                >
                  Contactar soporte
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
