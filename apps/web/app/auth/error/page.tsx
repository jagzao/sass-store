"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function extractTenantFromText(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const match = value.match(/\/t\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((part) => part.trim());
  const token = `${name}=`;
  const hit = parts.find((part) => part.startsWith(token));
  if (!hit) return null;
  return decodeURIComponent(hit.slice(token.length));
}

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl");
  const explicitTenant = searchParams.get("tenant");

  const errorMessages: { [key: string]: string } = {
    TenantMismatch:
      "You are trying to access a different tenant. Please log in to the correct tenant.",
    Configuration:
      "No pudimos completar la autenticacion. Volve a intentar desde el login del tenant.",
    Default: "An authentication error occurred. Please try again.",
  };

  // URL-only slug for SSR-stable Link (never default to zo-system here — that
  // hid cookie/referrer and wrongly redirected wondernails → zo-system).
  const tenantFromUrl = useMemo(() => {
    return explicitTenant || extractTenantFromText(callbackUrl) || "";
  }, [explicitTenant, callbackUrl]);

  useEffect(() => {
    const resolvedTenant =
      explicitTenant ||
      extractTenantFromText(callbackUrl) ||
      getCookie("auth_tenant_slug") ||
      extractTenantFromText(document.referrer) ||
      "zo-system";

    const qs = new URLSearchParams();
    if (error) {
      qs.set("error", error);
    }

    router.replace(
      `/t/${resolvedTenant}/login${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
  }, [router, explicitTenant, callbackUrl, error]);

  const message =
    error && errorMessages[error]
      ? errorMessages[error]
      : errorMessages.Default;

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Authentication Error
        </h1>
        <p className="text-gray-700 mb-4">{message}</p>
        {tenantFromUrl ? (
          <Link
            href={`/t/${tenantFromUrl}/login${error ? `?error=${encodeURIComponent(error)}` : ""}`}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Ir al login
          </Link>
        ) : (
          <p className="text-sm text-gray-600">
            Redirigiendo al login de tu tienda…
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Loading...</h1>
          </div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
