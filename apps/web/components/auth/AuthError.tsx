"use client";

import { useSearchParams } from "next/navigation";

interface AuthErrorProps {
  error?: string;
}

export function AuthError({ error: errorProp }: AuthErrorProps) {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error") || errorProp;

  if (!errorParam) {
    return null;
  }

  const errorMessages: { [key: string]: string } = {
    CredentialsSignin:
      "Credenciales inválidas. Por favor, verifica tu email y contraseña.",
    SessionRequired: "Se requiere inicio de sesión para acceder a esta página.",
    Default:
      "Ocurrió un error durante la autenticación. Por favor, intenta nuevamente.",
    TenantMismatch:
      "Estás intentando acceder a un tenant diferente. Por favor, inicia sesión con el tenant correcto.",
    Configuration:
      "Error de configuración. Por favor, contacta al administrador.",
    AccessDenied:
      "Acceso denegado. No tienes permisos para realizar esta acción.",
    Verification: "Error de verificación. El enlace podría haber expirado.",
    OAuthSignin: "Error al iniciar sesión con el proveedor OAuth.",
    OAuthCallback: "Error en el callback de OAuth.",
    OAuthCreateAccount: "Error al crear la cuenta con OAuth.",
    EmailCreateAccount: "Error al crear la cuenta con email.",
    Callback: "Error en el callback de autenticación.",
    OAuthAccountNotLinked:
      "Esta cuenta ya está asociada con otro proveedor de inicio de sesión.",
    EmailSignin: "Error al enviar el email de inicio de sesión.",
    SessionExpired:
      "La sesión ha expirado. Por favor, inicia sesión nuevamente.",
  };

  const message = errorMessages[errorParam] || errorMessages.Default;

  return (
    <div
      data-testid="auth-error"
      className="rounded-md bg-red-50 p-4 border border-red-200 mb-4"
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Error de autenticación
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
