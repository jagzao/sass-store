import { memo, ReactNode } from "react";
import {
  SearchableSelectSingle,
  SearchableSelectProps,
  SelectOption,
} from "./SearchableSelectSingle";

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "className"
> {
  label?: string;
  error?: string;
  helperText?: string;
  options: FormSelectOption[];
  placeholder?: string;
  containerClassName?: string;
  selectClassName?: string;
}

const FormSelect = memo(
  ({
    label,
    error,
    helperText,
    options,
    placeholder,
    containerClassName = "",
    selectClassName = "",
    id,
    disabled,
    value,
    onChange,
    ...props
  }: FormSelectProps) => {
    // Convertir FormSelectOption a SelectOption
    const selectOptions: SelectOption[] = options.map((opt) => ({
      value: opt.value,
      label: opt.label,
      disabled: opt.disabled,
    }));

    // Manejar el cambio de valor para mantener compatibilidad con la API original
    const handleValueChange = (selectedOption: SelectOption | null) => {
      if (onChange) {
        // Crear un evento sintético que simule el comportamiento del select nativo
        const syntheticEvent = {
          target: {
            value: selectedOption?.value || "",
            selectedIndex: selectedOption
              ? options.findIndex((opt) => opt.value === selectedOption.value)
              : -1,
          },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;

        onChange(syntheticEvent);
      }
    };

    // Convertir el valor actual al formato esperado por SearchableSelect
    const currentValue = typeof value === "string" ? value : "";

    return (
      <SearchableSelectSingle
        // Core props
        options={selectOptions}
        value={currentValue}
        onChange={handleValueChange}
        // UI props
        label={label}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        containerClassName={containerClassName}
        className={selectClassName}
        // Configuration
        isSearchable={false} // Mantener comportamiento similar al select nativo por defecto
        isDisabled={disabled}
        // IDs and accessibility
        id={id}
        name={props.name}
        required={props.required}
      />
    );
  },
);

FormSelect.displayName = "FormSelect";

export default FormSelect;
