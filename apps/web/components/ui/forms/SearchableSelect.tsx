"use client";

import React, { useId, useMemo } from "react";
import Select, {
  Props as ReactSelectProps,
  StylesConfig,
  GroupBase,
  SingleValue,
  MultiValue,
} from "react-select";
import AsyncSelect from "react-select/async";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  [key: string]: any;
}

export interface SearchableSelectProps<IsMulti extends boolean = false> {
  // Core props
  options?: SelectOption[];
  value?: IsMulti extends true
    ? SelectOption[] | string[]
    : SelectOption | string;
  onChange: (
    value: IsMulti extends true
      ? SelectOption[] | string[]
      : SelectOption | string | null,
  ) => void;

  // Configuration
  isMulti?: IsMulti;
  isSearchable?: boolean;
  isClearable?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;

  // Async props
  loadOptions?: (inputValue: string) => Promise<SelectOption[]>;
  defaultOptions?: boolean | SelectOption[];

  // UI props
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  noOptionsMessage?: string;
  loadingMessage?: string;

  // Styling
  containerClassName?: string;
  className?: string;
  labelClassName?: string;

  // Advanced
  name?: string;
  id?: string;
  required?: boolean;
  autoFocus?: boolean;
  menuPortalTarget?: HTMLElement;
  closeMenuOnSelect?: boolean;
  hideSelectedOptions?: boolean;

  // Callbacks
  onBlur?: () => void;
  onFocus?: () => void;
}

function SearchableSelectComponent<IsMulti extends boolean = false>(
  props: SearchableSelectProps<IsMulti>,
) {
  const {
    options = [],
    value,
    onChange,
    isMulti = false as IsMulti,
    isSearchable = true,
    isClearable = true,
    isDisabled = false,
    isLoading = false,
    loadOptions,
    defaultOptions,
    label,
    placeholder = "Seleccionar...",
    error,
    helperText,
    noOptionsMessage = "Sin opciones",
    loadingMessage = "Cargando...",
    containerClassName = "",
    className = "",
    labelClassName = "",
    name,
    id,
    required = false,
    autoFocus = false,
    menuPortalTarget,
    closeMenuOnSelect,
    hideSelectedOptions,
    onBlur,
    onFocus,
  } = props;

  // Generate ID if not provided
  const autoId = useId();
  const selectId = id || name || `select-${autoId.replace(/:/g, "")}`;

  // Convert value to react-select format
  const selectValue = useMemo(() => {
    if (!value) return isMulti ? [] : null;

    if (isMulti) {
      const valueArray: any[] = Array.isArray(value) ? value : [value];
      const mappedArray: SelectOption[] = [];
      for (const v of valueArray) {
        if (typeof v === "string") {
          const found = options.find((opt) => opt.value === v);
          mappedArray.push(found || { value: v, label: v });
        } else {
          mappedArray.push(v);
        }
      }
      return mappedArray;
    } else {
      if (typeof value === "string") {
        return (
          options.find((opt) => opt.value === value) || { value, label: value }
        );
      }
      return value as SelectOption;
    }
  }, [value, options, isMulti]);

  // Handle change event
  const handleChange = (
    newValue: SingleValue<SelectOption> | MultiValue<SelectOption>,
  ) => {
    if (isMulti) {
      const multiValue = (newValue as MultiValue<SelectOption>) || [];
      onChange(multiValue as any);
    } else {
      onChange(newValue as any);
    }
  };

  // Custom styles matching Tailwind design system
  const customStyles: StylesConfig<
    SelectOption,
    IsMulti,
    GroupBase<SelectOption>
  > = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: "38px",
        borderColor: error
          ? "rgb(239 68 68)"
          : state.isFocused
            ? "rgb(59 130 246)"
            : "rgb(209 213 219)",
        borderWidth: "1px",
        borderRadius: "0.375rem",
        backgroundColor: isDisabled ? "rgb(243 244 246)" : "white",
        boxShadow: state.isFocused
          ? "0 0 0 3px rgba(59, 130, 246, 0.1)"
          : "none",
        cursor: isDisabled ? "not-allowed" : "default",
        "&:hover": {
          borderColor: error
            ? "rgb(239 68 68)"
            : state.isFocused
              ? "rgb(59 130 246)"
              : "rgb(156 163 175)",
        },
        opacity: isDisabled ? 0.6 : 1,
        transition: "all 0.2s",
      }),
      valueContainer: (base) => ({
        ...base,
        padding: "2px 8px",
      }),
      input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
      }),
      indicatorSeparator: () => ({
        display: "none",
      }),
      dropdownIndicator: (base, state) => ({
        ...base,
        padding: "8px",
        color: state.isFocused ? "rgb(59 130 246)" : "rgb(107 114 128)",
        "&:hover": {
          color: "rgb(59 130 246)",
        },
        transition: "all 0.2s",
      }),
      clearIndicator: (base) => ({
        ...base,
        padding: "8px",
        color: "rgb(107 114 128)",
        "&:hover": {
          color: "rgb(239 68 68)",
        },
        transition: "all 0.2s",
      }),
      menu: (base) => ({
        ...base,
        zIndex: 9999,
        borderRadius: "0.375rem",
        boxShadow:
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        border: "1px solid rgb(229 231 235)",
      }),
      menuList: (base) => ({
        ...base,
        padding: "4px",
        borderRadius: "0.375rem",
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? "rgb(59 130 246)"
          : state.isFocused
            ? "rgb(239 246 255)"
            : "transparent",
        color: state.isSelected ? "white" : "rgb(17 24 39)",
        cursor: state.isDisabled ? "not-allowed" : "pointer",
        padding: "8px 12px",
        borderRadius: "0.25rem",
        fontSize: "0.875rem",
        "&:active": {
          backgroundColor: state.isSelected
            ? "rgb(37 99 235)"
            : "rgb(219 234 254)",
        },
        transition: "all 0.15s",
      }),
      multiValue: (base) => ({
        ...base,
        backgroundColor: "rgb(239 246 255)",
        borderRadius: "0.25rem",
        border: "1px solid rgb(191 219 254)",
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: "rgb(29 78 216)",
        fontSize: "0.875rem",
        padding: "2px 6px",
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: "rgb(59 130 246)",
        "&:hover": {
          backgroundColor: "rgb(239 68 68)",
          color: "white",
        },
        borderRadius: "0 0.25rem 0.25rem 0",
        transition: "all 0.15s",
      }),
      placeholder: (base) => ({
        ...base,
        color: "rgb(156 163 175)",
        fontSize: "0.875rem",
      }),
      noOptionsMessage: (base) => ({
        ...base,
        color: "rgb(107 114 128)",
        fontSize: "0.875rem",
        padding: "12px",
      }),
      loadingMessage: (base) => ({
        ...base,
        color: "rgb(107 114 128)",
        fontSize: "0.875rem",
        padding: "12px",
      }),
    }),
    [error, isDisabled],
  );

  // Common props for both Select and AsyncSelect
  const commonProps: Partial<
    ReactSelectProps<SelectOption, IsMulti, GroupBase<SelectOption>>
  > = {
    value: selectValue,
    onChange: handleChange,
    isMulti: isMulti,
    isSearchable,
    isClearable,
    isDisabled,
    isLoading,
    placeholder,
    noOptionsMessage: () => noOptionsMessage,
    loadingMessage: () => loadingMessage,
    styles: customStyles,
    className: className,
    classNamePrefix: "react-select",
    name,
    inputId: selectId,
    instanceId: selectId,
    required,
    autoFocus,
    menuPortalTarget,
    closeMenuOnSelect:
      closeMenuOnSelect !== undefined ? closeMenuOnSelect : !isMulti,
    hideSelectedOptions:
      hideSelectedOptions !== undefined ? hideSelectedOptions : isMulti,
    onBlur,
    onFocus,
    // Accessibility
    "aria-label": label || placeholder,
    "aria-invalid": !!error,
    "aria-describedby": error
      ? `${selectId}-error`
      : helperText
        ? `${selectId}-helper`
        : undefined,
  } as any;

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={selectId}
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {loadOptions ? (
        <AsyncSelect
          {...commonProps}
          cacheOptions
          defaultOptions={defaultOptions}
          loadOptions={loadOptions}
        />
      ) : (
        <Select {...commonProps} options={options} />
      )}

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
        <p id={`${selectId}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

// Export memoized version with proper typing
// Export component without memo for better TypeScript support with generics
export const SearchableSelect = SearchableSelectComponent;

export default SearchableSelect;
