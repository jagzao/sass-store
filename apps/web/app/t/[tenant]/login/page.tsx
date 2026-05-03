import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthError } from "@/components/auth/AuthError";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const tenant = await getTenantBySlug(resolvedParams.tenant);
    if (!tenant) {
      return {
        title: "Iniciar Sesión - Sass Store",
        description: "Inicia sesión en tu cuenta",
      };
    }
    return {
      title: `Iniciar Sesión - ${tenant.name}`,
      description: `Inicia sesión en ${tenant.name}`,
    };
  } catch {
    return {
      title: "Iniciar Sesión - Sass Store",
      description: "Inicia sesión en tu cuenta",
    };
  }
}

export default async function LoginPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Ligero: el layout `[tenant]` ya validó slug; evitar resolveTenant + getTenantWithData
  // (hasta ~30s de carrera con timeouts) que degradaba TTFB y podía disparar 404 falsos.
  const tenantRow = await getTenantBySlug(resolvedParams.tenant);
  if (!tenantRow) {
    notFound();
  }

  const branding = (tenantRow.branding || {}) as {
    primaryColor?: string;
  };
  const primaryColor = branding.primaryColor ?? "#6366f1";

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Tenant Branding */}
        <div className="text-center">
          <div className="text-4xl mb-4">
            {tenantRow.name.includes("Wonder")
              ? "💅"
              : tenantRow.name.includes("Vigi")
                ? "✂️"
                : tenantRow.name.includes("Zo")
                  ? "💻"
                  : "🏪"}
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{tenantRow.name}</h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión en tu cuenta
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Error display */}
          <AuthError error={resolvedSearchParams.error as string} />

          {/* Login Form */}
          <LoginForm
            tenantSlug={resolvedParams.tenant}
            primaryColor={primaryColor}
          />

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <a
              href={`/t/${resolvedParams.tenant}/forgot-password`}
              className="text-sm font-medium hover:opacity-80"
              style={{ color: primaryColor }}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  O continúa con
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="mt-6">
              <GoogleLoginButton tenantSlug={resolvedParams.tenant} />
            </div>
          </div>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <a
                href={`/t/${resolvedParams.tenant}/register`}
                className="font-medium hover:opacity-80"
                style={{ color: primaryColor }}
              >
                Regístrate aquí
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
