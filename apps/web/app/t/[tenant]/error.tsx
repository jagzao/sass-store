"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface TenantErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TenantError({ error, reset }: TenantErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error("[TenantError] Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Error del Tenant</h1>
          <p className="mt-2 text-sm text-gray-600">
            Ha ocurrido un error al cargar el tenant.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Algo salió mal
          </h2>
          <p className="text-sm text-red-700 mb-4">
            {error.message ||
              "Error al cargar la página del tenant. Esto podría deberse a:"}
          </p>
          <ul className="text-sm text-red-700 list-disc list-inside mb-4">
            <li>Configuración inválida del tenant</li>
            <li>Problemas de conectividad con la base de datos</li>
            <li>Datos del tenant faltantes</li>
            <li>Permisos insuficientes</li>
          </ul>
        </div>

        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Intentar nuevamente
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
