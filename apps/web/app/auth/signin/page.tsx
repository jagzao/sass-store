"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getTenantFromUrl } from "@/lib/tenant/utils";
import { Suspense } from "react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirect = async () => {
      try {
        // Get the callback URL from the search parameters
        const callbackUrl = searchParams.get("callbackUrl");

        // Extract tenant from callback URL or fallback to default
        let tenantSlug = "zo-system"; // Default fallback

        if (callbackUrl) {
          const extractedTenant = getTenantFromUrl(callbackUrl);
          if (extractedTenant) {
            tenantSlug = extractedTenant;
          }
        }

        // Check if there's an error parameter
        const errorParam = searchParams.get("error");
        if (errorParam) {
          // Redirect to tenant login page with error
          router.push(`/t/${tenantSlug}/login?error=${errorParam}`);
        } else {
          // Redirect to tenant login page
          router.push(`/t/${tenantSlug}/login`);
        }
      } catch (err) {
        console.error("Error during sign-in redirect:", err);
        setError("Error al redirigir a la página de inicio de sesión");
        setIsRedirecting(false);
      }
    };

    redirect();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error de Redirección
          </h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold mb-2">Redirigiendo...</h1>
        <p className="text-gray-600">
          Estás siendo redirigido a la página de inicio de sesión.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold mb-2">Cargando...</h1>
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
