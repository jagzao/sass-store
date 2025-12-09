"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormInput, PasswordInput } from "@/components/ui/forms";

interface LoginFormProps {
  tenantSlug: string;
  primaryColor: string;
}

export function LoginForm({ tenantSlug, primaryColor }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

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
          `/t/${tenantSlug}`,
        );
        // Store current tenant in localStorage for session persistence
        localStorage.setItem("currentTenant", tenantSlug);
        // Redirect to tenant page on success
        router.push(`/t/${tenantSlug}`);
      } else {
        console.warn("[LoginForm] SignIn result not ok:", result);
      }
    } catch (err) {
      console.error("[LoginForm] Login error:", err);
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
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

      <FormInput
        id="email"
        name="email"
        type="email"
        label="Correo electrónico"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
        disabled={isLoading}
        data-testid="email-input"
        inputClassName={`focus:ring-2 focus:ring-offset-2`}
        style={{ borderColor: primaryColor }}
      />

      <PasswordInput
        id="password"
        name="password"
        label="Contraseña"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
        disabled={isLoading}
        data-testid="password-input"
        inputClassName={`focus:ring-2 focus:ring-offset-2`}
        style={{ borderColor: primaryColor }}
      />

      {/* Remember me & Forgot password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
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
    </form>
  );
}
