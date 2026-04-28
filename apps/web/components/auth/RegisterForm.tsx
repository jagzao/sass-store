"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormInput, PasswordInput } from "@/components/ui/forms";

interface RegisterFormProps {
  tenantSlug: string;
  primaryColor: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export function RegisterForm({ tenantSlug, primaryColor }: RegisterFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const validateForm = (): string | null => {
    if (!formData.name || formData.name.trim().length === 0) {
      return "El nombre es requerido";
    }

    if (!formData.email || formData.email.trim().length === 0) {
      return "El correo electrónico es requerido";
    }

    const emailRegex =
      /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ._%+-]+@[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      return "El email es inválido";
    }

    if (!formData.password || formData.password.length === 0) {
      return "La contraseña es requerida";
    }

    if (formData.password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }

    if (!/[A-Z]/.test(formData.password)) {
      return "La contraseña debe contener al menos una mayúscula";
    }

    if (!/[a-z]/.test(formData.password)) {
      return "La contraseña debe contener al menos una minúscula";
    }

    if (!/[0-9]/.test(formData.password)) {
      return "La contraseña debe contener al menos un número";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Las contraseñas no coinciden";
    }

    if (!formData.terms) {
      return "Debes aceptar los términos y condiciones";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          tenantSlug,
        }),
      });

      if (!response.ok) {
        const result = await response
          .json()
          .catch(() => ({ error: "Error al crear la cuenta" }));
        throw new Error(result.error || "Error al crear la cuenta");
      }

      console.log("[RegisterForm] Registration successful, redirecting...");
      router.push(`/t/${tenantSlug}/login?registered=true`);
    } catch (err) {
      console.error("[RegisterForm] Registration error:", err);
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
      setIsLoading(false);
    }
  };

  const updateField = <K extends keyof RegisterFormData>(
    field: K,
    value: RegisterFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
      noValidate
      data-testid="register-form"
    >
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
        >
          {error}
        </div>
      )}

      {/* Google registration */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: `/t/${tenantSlug}` })}
        disabled={isLoading}
        className="w-full inline-flex justify-center items-center gap-3 py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <GoogleIcon />
        Registrarse con Google
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">O con correo y contraseña</span>
        </div>
      </div>

      <FormInput
        id="name"
        name="name"
        type="text"
        label="Nombre completo"
        placeholder="Tu nombre completo"
        value={formData.name}
        onChange={(e) => updateField("name", e.target.value)}
        autoComplete="name"
        required
        disabled={isLoading}
        inputClassName="focus:ring-2 focus:ring-offset-2"
        style={{ borderColor: primaryColor }}
      />

      <FormInput
        id="email"
        name="email"
        type="email"
        label="Correo electrónico"
        placeholder="tu@email.com"
        value={formData.email}
        onChange={(e) => updateField("email", e.target.value)}
        autoComplete="email"
        required
        disabled={isLoading}
        inputClassName="focus:ring-2 focus:ring-offset-2"
        style={{ borderColor: primaryColor }}
      />

      <FormInput
        id="phone"
        name="phone"
        type="tel"
        label="Teléfono"
        placeholder="55 1234 5678"
        value={formData.phone}
        onChange={(e) => updateField("phone", e.target.value)}
        autoComplete="tel"
        required
        disabled={isLoading}
        maxLength={10}
        pattern="[0-9]{10}"
        helperText="Ingresa tu número de teléfono sin espacios ni guiones (10 dígitos)"
        inputClassName="focus:ring-2 focus:ring-offset-2"
        style={{ borderColor: primaryColor }}
      />

      <PasswordInput
        id="password"
        name="password"
        label="Contraseña"
        placeholder="••••••••"
        value={formData.password}
        onChange={(e) => updateField("password", e.target.value)}
        autoComplete="new-password"
        required
        disabled={isLoading}
        showStrengthIndicator
        inputClassName="focus:ring-2 focus:ring-offset-2"
        style={{ borderColor: primaryColor }}
      />

      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar contraseña"
        placeholder="••••••••"
        value={formData.confirmPassword}
        onChange={(e) => updateField("confirmPassword", e.target.value)}
        autoComplete="new-password"
        required
        disabled={isLoading}
        inputClassName="focus:ring-2 focus:ring-offset-2"
        style={{ borderColor: primaryColor }}
      />

      {/* Terms and conditions */}
      <div className="flex items-center">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          checked={formData.terms}
          onChange={(e) => updateField("terms", e.target.checked)}
          required
          disabled={isLoading}
          className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
          style={{
            accentColor: primaryColor,
          }}
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
          Acepto los{" "}
          <a
            href="#"
            className="font-medium hover:opacity-80"
            style={{ color: primaryColor }}
          >
            términos y condiciones
          </a>{" "}
          y la{" "}
          <a
            href="#"
            className="font-medium hover:opacity-80"
            style={{ color: primaryColor }}
          >
            política de privacidad
          </a>
        </label>
      </div>

      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          data-testid="register-submit"
          aria-label="Crear cuenta"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: primaryColor,
          }}
        >
          {isLoading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </div>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}
