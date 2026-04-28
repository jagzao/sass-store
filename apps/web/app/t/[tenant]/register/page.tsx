import React from "react";
import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolver";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { RegisterForm } from "@/components/auth/RegisterForm";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function RegisterPage({ params }: PageProps) {
  const resolvedParams = await params;

  // Resolve tenant to ensure it exists and is valid
  const resolvedTenant = await resolveTenant();

  if (!resolvedTenant) {
    notFound();
  }

  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);
  const branding = tenantData.branding as any;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Tenant Branding */}
        <div className="text-center">
          <div className="text-4xl mb-4">
            {tenantData.name.includes("Wonder")
              ? "💅"
              : tenantData.name.includes("Vigi")
                ? "✂️"
                : tenantData.name.includes("Zo")
                  ? "💻"
                  : "🏪"}
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {tenantData.name}
          </h2>
          <p className="mt-2 text-sm text-gray-600">Crea tu cuenta</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Register Form */}
          <RegisterForm
            tenantSlug={resolvedParams.tenant}
            primaryColor={branding.primaryColor}
          />

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <a
                href={`/t/${resolvedParams.tenant}/login`}
                className="font-medium hover:opacity-80"
                style={{ color: branding.primaryColor }}
              >
                Inicia sesión aquí
              </a>
            </p>
          </div>

          {/* Back to store */}
          <div className="mt-6 text-center">
            <a
              href={`/t/${resolvedParams.tenant}`}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Volver a la tienda
            </a>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 text-center">
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="mr-1">🔒</span>
              Seguro
            </div>
            <div className="flex items-center">
              <span className="mr-1">🛡️</span>
              Protegido
            </div>
            <div className="flex items-center">
              <span className="mr-1">⚡</span>
              Rápido
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
