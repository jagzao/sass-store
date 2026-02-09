"use client";

import React from "react";

import { SearchableSelectSingle } from "./SearchableSelectSingle";
import { SelectOption } from "./SearchableSelect";

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
  className?: string;
  labelClassName?: string;
}

const FormSelect = ({
  label,
  error,
  helperText,
  options,
  placeholder,
  containerClassName = "",
  selectClassName = "",
  className = "",
  labelClassName = "",
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
  const handleValueChange = (selectedOption: SelectOption | string | null) => {
    // Si obtenemos un string o null, lo tratamos como tal. Si es objeto, sacamos value.
    const finalValue =
      typeof selectedOption === "object" && selectedOption !== null
        ? selectedOption.value
        : (selectedOption as string | null);

    if (onChange && finalValue !== null) {
      // Find the original option to ensure we have the correct label/value pair if needed,
      // though for the event we mostly need the value.
      const optionObject = options.find((opt) => opt.value === finalValue);

      const syntheticEvent = {
        target: {
          value: finalValue,
          selectedIndex: optionObject ? options.indexOf(optionObject) : -1,
          name: props.name,
          id: id,
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
      onChange={handleValueChange as any}
      // UI props
      label={label}
      labelClassName={labelClassName}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      containerClassName={containerClassName}
      className={`${selectClassName} ${className}`.trim()}
      // Configuration
      isSearchable={true} // Enable search by default
      isDisabled={disabled}
      // IDs and accessibility
      id={id}
      name={props.name}
      required={props.required}
    />
  );
};

export default FormSelect;
