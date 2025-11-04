"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const params = useParams();
  const tenantSlug = params?.tenant as string;
  const [tenantData, setTenantData] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await fetch(`/api/tenants/${tenantSlug}`);
        if (res.ok) {
          const data = await res.json();
          setTenantData(data);
        }
      } catch (err) {
        console.error("Error fetching tenant:", err);
      }
    };
    fetchTenant();
  }, [tenantSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tenantSlug }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Error al enviar el correo" }));
        throw new Error(data.error || "Error al enviar el correo");
      }

      const data = await response.json().catch(() => ({ success: true }));
      console.log('[ForgotPassword] Success response:', data);
      setSuccess(true);
    } catch (err: any) {
      console.error('[ForgotPassword] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const primaryColor = tenantData?.branding?.primary_color || "#4F46E5";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Recuperar Contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ingresa tu correo electrónico y te enviaremos un enlace para
          restablecer tu contraseña
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Correo enviado
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Revisa tu bandeja de entrada para restablecer tu contraseña.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/t/${tenantSlug}/login`}
                  style={{ color: primaryColor }}
                  className="text-sm font-medium hover:opacity-75"
                >
                  Volver al inicio de sesión →
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Correo electrónico
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href={`/t/${tenantSlug}/login`}
                  style={{ color: primaryColor }}
                  className="text-sm font-medium hover:opacity-75"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
