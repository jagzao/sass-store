import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolver";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { signIn } from "@/lib/auth";
import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

interface PageProps {
  params: {
    tenant: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const tenantData = await getTenantDataForPage(params.tenant);

    return {
      title: `Iniciar Sesión - ${tenantData.name}`,
      description: `Inicia sesión en ${tenantData.name}`,
    };
  } catch (error) {
    return {
      title: "Iniciar Sesión - Sass Store",
      description: "Inicia sesión en tu cuenta",
    };
  }
}

export default async function LoginPage({ params }: PageProps) {
  // Resolve tenant to ensure it exists and is valid
  const resolvedTenant = await resolveTenant();

  if (!resolvedTenant) {
    notFound();
  }

  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(params.tenant);
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
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión en tu cuenta
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Login Form */}
          <LoginForm
            tenantSlug={params.tenant}
            primaryColor={branding.primaryColor}
          />

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <a
              href={`/t/${params.tenant}/forgot-password`}
              className="text-sm font-medium hover:opacity-80"
              style={{ color: branding.primaryColor }}
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
            <div className="mt-6 grid grid-cols-2 gap-3">
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: `/t/${params.tenant}` });
                }}
              >
                <button
                  type="submit"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <span className="mr-2">📧</span>
                  Google
                </button>
              </form>
              <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed">
                <span className="mr-2">📘</span>
                Facebook (Soon)
              </button>
            </div>
          </div>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <a
                href={`/t/${params.tenant}/register`}
                className="font-medium hover:opacity-80"
                style={{ color: branding.primaryColor }}
              >
                Regístrate aquí
              </a>
            </p>
          </div>

          {/* Back to store */}
          <div className="mt-6 text-center">
            <a
              href={`/t/${params.tenant}`}
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
