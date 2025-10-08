"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-700 to-red-900 flex items-center justify-center px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="text-8xl mb-4 animate-pulse">⚠️</div>
              <h1 className="text-6xl font-bold text-white mb-4">
                5<span className="text-red-400">0</span>0
              </h1>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Error del Sistema
              </h2>
              <p className="text-red-100 text-lg mb-6">
                Algo salió mal. Nuestro equipo fue notificado.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={reset}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mr-4"
              >
                🔄 Reintentar
              </button>
              <a
                href="/"
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                🏠 Volver al Inicio
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
