import { memo, TextareaHTMLAttributes } from 'react';

export interface FormTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  containerClassName?: string;
  textareaClassName?: string;
  labelClassName?: string;
}

const FormTextarea = memo(({
  label,
  error,
  helperText,
  showCharCount = false,
  containerClassName = '',
  textareaClassName = '',
  labelClassName = '',
  id,
  disabled,
  value,
  maxLength,
  ...props
}: FormTextareaProps) => {
  const textareaId = id || props.name || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const baseTextareaClassName = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors resize-vertical";
  const stateClassName = error
    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  const disabledClassName = disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : "bg-white";

  const finalTextareaClassName = `${baseTextareaClassName} ${stateClassName} ${disabledClassName} ${textareaClassName}`.trim();

  const currentLength = typeof value === 'string' ? value.length : 0;
  const showCounter = showCharCount && (maxLength !== undefined || currentLength > 0);

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={textareaId}
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        disabled={disabled}
        value={value}
        maxLength={maxLength}
        className={finalTextareaClassName}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        {...props}
      />

      {showCounter && (
        <div className="flex justify-between items-center mt-1">
          <div className="flex-1">
            {error && (
              <p
                id={`${textareaId}-error`}
                className="text-sm text-red-600"
                role="alert"
              >
                {error}
              </p>
            )}

            {!error && helperText && (
              <p
                id={`${textareaId}-helper`}
                className="text-sm text-gray-500"
              >
                {helperText}
              </p>
            )}
          </div>

          <p className={`text-xs ml-2 ${currentLength === maxLength ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            {currentLength}{maxLength !== undefined && `/${maxLength}`}
          </p>
        </div>
      )}

      {!showCounter && error && (
        <p
          id={`${textareaId}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      {!showCounter && !error && helperText && (
        <p
          id={`${textareaId}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

FormTextarea.displayName = 'FormTextarea';

export default FormTextarea;
