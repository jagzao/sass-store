import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import { Metadata } from "next";
import { Suspense } from "react";
import { isGoogleOAuthConfigured } from "@sass-store/config/auth-env";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthError } from "@/components/auth/AuthError";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { StripAuthErrorQuery } from "@/components/auth/StripAuthErrorQuery";
import {
  getLoginContent,
  getTenantInitial,
  type LoginFeatureIcon,
} from "@/lib/tenant/login-content";

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

  const tenantRow = await getTenantBySlug(resolvedParams.tenant);
  if (!tenantRow) {
    notFound();
  }

  const branding = (tenantRow.branding || {}) as {
    primaryColor?: string;
  };
  const primaryColor = branding.primaryColor ?? "#ff8000";
  const showGoogleLogin = isGoogleOAuthConfigured();

  const loginContent = getLoginContent(resolvedParams.tenant, tenantRow.name);
  const tenantInitial = getTenantInitial(tenantRow.name);

  const featureIconPath: Record<LoginFeatureIcon, string> = {
    shield:
      "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    bolt: "M13 10V3L4 14h7v7l9-11h-7z",
    cloud:
      "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030712]">
      {/* Background gradient + particles effect */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(255,128,0,0.12) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(234,255,0,0.06) 0%, transparent 40%), linear-gradient(135deg, #030712 0%, #0a0f1c 50%, #030712 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ff8000' stroke-width='0.5' opacity='0.15'%3E%3Ccircle cx='60' cy='60' r='58'/%3E%3Ccircle cx='60' cy='60' r='45'/%3E%3Ccircle cx='60' cy='60' r='30'/%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: "180px 180px",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />
      </div>

      <div
        className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-8 px-6 py-8 lg:grid-cols-2 lg:px-12"
        id="login-page-root"
      >
        {/* Left panel */}
        <section className="flex flex-col justify-center lg:pr-12">
          <h1 className="mb-4 text-4xl font-light leading-tight text-white md:text-5xl lg:text-6xl">
            Bienvenido a
            <br />
            <span className="font-bold" style={{ color: primaryColor }}>
              {loginContent.headline}
            </span>
          </h1>
          <p className="mb-10 max-w-md text-base leading-relaxed text-gray-400">
            {loginContent.tagline}
          </p>

          <div className="mb-12 space-y-6">
            {loginContent.features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke={primaryColor}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={featureIconPath[feature.icon]}
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {loginContent.quote && (
            <blockquote
              className="max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              style={{ borderColor: `${primaryColor}30` }}
            >
              <p className="mb-3 text-sm leading-relaxed text-gray-300">
                “{loginContent.quote.text}”
              </p>
              <cite
                className="text-sm font-medium not-italic"
                style={{ color: primaryColor }}
              >
                — {loginContent.quote.author}
              </cite>
            </blockquote>
          )}
        </section>

        {/* Right panel — Login card */}
        <section className="flex w-full justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0B1021]/80 p-8 shadow-2xl backdrop-blur-md md:p-10">
            {/* Logo + title */}
            <div className="mb-8 text-center">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 text-3xl font-bold"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                {tenantInitial}
              </div>
              <h2 className="text-2xl font-bold text-white">Iniciar sesión</h2>
              <p className="mt-1 text-sm text-gray-400">
                Accede a tu cuenta de {tenantRow.name}
              </p>
            </div>

            {/* Error display */}
            <Suspense fallback={null}>
              <StripAuthErrorQuery />
              <AuthError error={resolvedSearchParams.error as string} />
            </Suspense>

            <LoginForm
              tenantSlug={resolvedParams.tenant}
              primaryColor={primaryColor}
            />

            {/* Forgot password - mobile/secondary */}
            <div className="mt-4 text-center">
              <a
                href={`/t/${resolvedParams.tenant}/forgot-password`}
                className="text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: primaryColor }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {showGoogleLogin && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-[#0B1021] px-3 text-gray-500">
                      O continúa con
                    </span>
                  </div>
                </div>
                <GoogleLoginButton
                  tenantSlug={resolvedParams.tenant}
                  primaryColor={primaryColor}
                />
              </>
            )}

            {/* Sign up */}
            <p className="mt-6 text-center text-sm text-gray-400">
              ¿No tienes cuenta?{" "}
              <a
                href={`/t/${resolvedParams.tenant}/register`}
                className="font-semibold transition-opacity hover:opacity-80"
                style={{ color: primaryColor }}
              >
                Regístrate aquí
              </a>
            </p>

            {/* Back to store */}
            <div className="mt-6 text-center">
              <a
                href={`/t/${resolvedParams.tenant}`}
                className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Volver a la tienda
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
