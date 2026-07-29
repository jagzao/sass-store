"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FeedbackErrorTrigger } from "@/components/feedback/FeedbackErrorTrigger";

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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Error del Tenant
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ha ocurrido un error al cargar el tenant.
          </p>
        </div>

        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Algo salió mal
          </h2>
          <p className="text-sm text-destructive/90 mb-4">
            {error.message ||
              "Error al cargar la página del tenant. Esto podría deberse a:"}
          </p>
          <ul className="text-sm text-destructive/90 list-disc list-inside mb-4">
            <li>Configuración inválida del tenant</li>
            <li>Problemas de conectividad con la base de datos</li>
            <li>Datos del tenant faltantes</li>
            <li>Permisos insuficientes</li>
          </ul>
        </div>

        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            Intentar nuevamente
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full flex justify-center py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-card-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            Volver al inicio
          </button>

          <FeedbackErrorTrigger error={error} />
        </div>
      </div>
    </div>
  );
}
