import { memo, SelectHTMLAttributes, ReactNode } from 'react';

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: FormSelectOption[];
  placeholder?: string;
  containerClassName?: string;
  selectClassName?: string;
}

const FormSelect = memo(({
  label,
  error,
  helperText,
  options,
  placeholder,
  containerClassName = '',
  selectClassName = '',
  id,
  disabled,
  ...props
}: FormSelectProps) => {
  const selectId = id || props.name || `select-${Math.random().toString(36).substr(2, 9)}`;

  const baseSelectClassName = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors appearance-none bg-no-repeat bg-right pr-10";
  const stateClassName = error
    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  const disabledClassName = disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : "bg-white";

  const finalSelectClassName = `${baseSelectClassName} ${stateClassName} ${disabledClassName} ${selectClassName}`.trim();

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          className={finalSelectClassName}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && (
        <p
          id={`${selectId}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          id={`${selectId}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

FormSelect.displayName = 'FormSelect';

export default FormSelect;
