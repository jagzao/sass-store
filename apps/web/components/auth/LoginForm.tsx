"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  tenantSlug: string;
  primaryColor: string;
}

export function LoginForm({ tenantSlug, primaryColor }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        tenantSlug,
        rememberMe,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError(
            "Credenciales no válidas para este tenant. Verifica tu correo y contraseña.",
          );
        } else {
          setError("Error al iniciar sesión. Por favor intenta nuevamente.");
        }
        return;
      }

      if (result?.ok) {
        localStorage.setItem("currentTenant", tenantSlug);
        window.location.href = `/t/${tenantSlug}`;
      }
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClass =
    "w-full rounded-xl border border-white/10 bg-[#0f1528] px-4 py-3 pl-11 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-opacity-50 focus:bg-[#121a30]";

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div
          data-testid="error-message"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
            />
          </svg>
        </div>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={isLoading}
          data-testid="email-input"
          aria-label="Correo electrónico"
          className={inputBaseClass}
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        />
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={isLoading}
          data-testid="password-input"
          aria-label="Contraseña"
          className={`${inputBaseClass} pr-10`}
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={isLoading}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500 transition-colors hover:text-gray-300"
          aria-label={
            showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
          }
        >
          {showPassword ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-white/20 bg-[#0f1528] text-orange-500 focus:ring-orange-500/40"
          />
          Recordarme
        </label>

        <a
          href={`/t/${tenantSlug}/forgot-password`}
          className="text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: primaryColor }}
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <button
        data-testid="login-btn"
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 hover:shadow-orange-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B1021] disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: primaryColor }}
      >
        {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
