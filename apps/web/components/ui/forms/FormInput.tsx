import { memo, InputHTMLAttributes } from 'react';

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
}

const FormInput = memo(({
  label,
  error,
  helperText,
  containerClassName = '',
  inputClassName = '',
  labelClassName = '',
  id,
  disabled,
  ...props
}: FormInputProps) => {
  const inputId = id || props.name || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseInputClassName = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors";
  const stateClassName = error
    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  const disabledClassName = disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : "bg-white";

  const finalInputClassName = `${baseInputClassName} ${stateClassName} ${disabledClassName} ${inputClassName}`.trim();

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        disabled={disabled}
        className={finalInputClassName}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />

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
        <p
          id={`${inputId}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
