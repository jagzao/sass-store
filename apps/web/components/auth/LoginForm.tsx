"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  tenantSlug: string;
  primaryColor: string;
}

export function LoginForm({ tenantSlug, primaryColor }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    console.log("[LoginForm] Attempting login with:", { email, tenantSlug });

    try {
      const result = await signIn("credentials", {
        email,
        password,
        tenantSlug,
        redirect: false,
      });

      console.log("[LoginForm] SignIn result:", result);

      if (result?.error) {
        console.error("[LoginForm] SignIn error:", result.error);
        throw new Error("Credenciales inválidas");
      }

      if (result?.ok) {
        console.log(
          "[LoginForm] SignIn successful, redirecting to:",
          `/t/${tenantSlug}`
        );
        // Store current tenant in localStorage for session persistence
        localStorage.setItem("currentTenant", tenantSlug);
        // Redirect to tenant page on success
        router.push(`/t/${tenantSlug}`);
      } else {
        console.warn("[LoginForm] SignIn result not ok:", result);
      }
    } catch (err: any) {
      console.error("[LoginForm] Login error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div
          data-testid="error-message"
          className="rounded-md bg-red-50 p-4 border border-red-200"
          role="alert"
        >
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Correo electrónico
        </label>
        <div className="mt-1">
          <input
            data-testid="email-input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
            style={{
              borderColor: primaryColor,
            }}
            placeholder="tu@email.com"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Contraseña
        </label>
        <div className="mt-1 relative">
          <input
            data-testid="password-input"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
            style={{
              borderColor: primaryColor,
            }}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Remember me & Forgot password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-2"
            style={{
              accentColor: primaryColor,
            }}
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-sm text-gray-900"
          >
            Recordarme
          </label>
        </div>

        <div className="text-sm">
          <a
            href={`/t/${tenantSlug}/forgot-password`}
            className="font-medium hover:opacity-80"
            style={{ color: primaryColor }}
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>

      {/* Submit button */}
      <div>
        <button
          data-testid="login-btn"
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: primaryColor,
          }}
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </div>
    </form>
  );
}
