"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
        const result = await response.json().catch(() => ({ error: "Error al crear la cuenta" }));
        throw new Error(result.error || "Error al crear la cuenta");
      }

      console.log('[RegisterForm] Registration successful, redirecting...');
      router.push(`/t/${tenantSlug}/login?registered=true`);
    } catch (err) {
      console.error('[RegisterForm] Registration error:', err);
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
      setIsLoading(false);
    }
  };

  const updateField = <K extends keyof RegisterFormData>(
    field: K,
    value: RegisterFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
        >
          {error}
        </div>
      )}

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
