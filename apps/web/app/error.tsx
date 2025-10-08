"use client";

import { useEffect, useState } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.error("Application Error:", error);
  }, [error]);

  if (!mounted) {
    // Show simple error during SSR/prerendering
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-8xl mb-4">⚠️</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            ¡Oops! Algo salió mal
          </h1>
          <p className="text-gray-600">Estamos trabajando para solucionarlo</p>
        </div>
      </div>
    );
  }

  const getErrorIcon = () => {
    if (error.message.includes("Network")) return "🌐";
    if (error.message.includes("Timeout")) return "⏱️";
    if (error.message.includes("Database") || error.message.includes("SQL"))
      return "🗄️";
    if (error.message.includes("Auth")) return "🔐";
    return "⚠️";
  };

  const handleSelfHeal = () => {
    try {
      // Clear all storage
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();

        // Clear any cached data
        if ("caches" in window) {
          caches.keys().then(function (names) {
            for (let name of names) caches.delete(name);
          });
        }
      }

      // Reset the error boundary
      reset();

      // If reset doesn't work, redirect to home
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (e) {
      console.error("Self-heal failed:", e);
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Error Animation */}
        <div className="mb-8">
          <div className="text-8xl mb-4 animate-pulse">{getErrorIcon()}</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            ¡Oops! Algo salió mal
          </h1>
          <p className="text-gray-600">
            No te preocupes, estamos trabajando para solucionarlo
          </p>
        </div>

        {/* Error Type Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
            {error.name || "Error del Sistema"}
          </span>
        </div>

        {/* Self-Healing Actions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h3 className="text-white font-semibold mb-4 flex items-center justify-center">
            <span className="mr-2">🔧</span>
            Intentos de Auto-Reparación
          </h3>

          <div className="space-y-3">
            <button
              onClick={handleSelfHeal}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <span className="mr-2">🚀</span>
              Reparar Automáticamente
            </button>

            <button
              onClick={reset}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <span className="mr-2">🔄</span>
              Reintentar
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-3">
            El sistema intentará limpiar datos corruptos y restablecer la
            conexión
          </p>
        </div>

        {/* Navigation Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <a
            href="/"
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">🏠</span>
            Inicio
          </a>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span className="mr-2">🔄</span>
            Recargar
          </button>

          <a
            href="/support"
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span className="mr-2">📞</span>
            Soporte
          </a>
        </div>

        {/* Error Report */}
        <div className="text-gray-600 text-sm mb-6">
          <p>Error ID: {error.digest || "N/A"}</p>
          <p>Tiempo: {new Date().toLocaleString("es-MX")}</p>
        </div>

        {/* Auto-recovery countdown */}
        <div className="text-xs text-gray-500 mt-4">
          Sistema de auto-reparación activado 🤖
        </div>
      </div>
    </div>
  );
}
