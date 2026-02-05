import { memo, useState, InputHTMLAttributes } from "react";

export interface PasswordInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> {
  label?: string;
  error?: string;
  helperText?: string;
  showStrengthIndicator?: boolean;
  containerClassName?: string;
  inputClassName?: string;
}

const PasswordInput = memo(
  ({
    label,
    error,
    helperText,
    showStrengthIndicator = false,
    containerClassName = "",
    inputClassName = "",
    id,
    disabled,
    value,
    ...props
  }: PasswordInputProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId =
      id || props.name || `password-${Math.random().toString(36).substr(2, 9)}`;

    const baseInputClassName =
      "w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 transition-colors !text-gray-900";
    const stateClassName = error
      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
    const disabledClassName = disabled
      ? "bg-gray-100 cursor-not-allowed opacity-60"
      : "bg-white";

    const finalInputClassName =
      `${baseInputClassName} ${stateClassName} ${disabledClassName} ${inputClassName}`.trim();

    const getPasswordStrength = (
      password: string,
    ): { level: number; label: string; color: string } => {
      if (!password) return { level: 0, label: "", color: "" };

      let strength = 0;
      if (password.length >= 8) strength++;
      if (password.length >= 12) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^a-zA-Z0-9]/.test(password)) strength++;

      if (strength <= 2)
        return { level: 1, label: "Débil", color: "bg-red-500" };
      if (strength <= 4)
        return { level: 2, label: "Media", color: "bg-yellow-500" };
      return { level: 3, label: "Fuerte", color: "bg-green-500" };
    };

    const passwordStrength =
      showStrengthIndicator && typeof value === "string"
        ? getPasswordStrength(value)
        : null;

    return (
      <div className={containerClassName}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            id={inputId}
            type={showPassword ? "text" : "password"}
            disabled={disabled}
            value={value}
            className={finalInputClassName}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

        {showStrengthIndicator &&
          passwordStrength &&
          passwordStrength.level > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Seguridad:</span>
                <span className="text-xs font-medium text-gray-700">
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.level / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
