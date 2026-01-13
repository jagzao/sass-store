"use client";

import React from "react";
import {
  SearchableSelect,
  SearchableSelectProps,
  SelectOption,
} from "./SearchableSelect";

/**
 * SearchableSelectSingle
 *
 * Wrapper para single-select (selección única) con búsqueda.
 * Simplifica el uso de SearchableSelect para casos donde solo se permite seleccionar una opción.
 *
 * @example
 * ```tsx
 * <SearchableSelectSingle
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' }
 *   ]}
 *   value="1"
 *   onChange={(option) => console.log(option)}
 *   label="Select an option"
 * />
 * ```
 */

export interface SearchableSelectSingleProps extends Omit<
  SearchableSelectProps<false>,
  "isMulti"
> {}

export function SearchableSelectSingle(props: SearchableSelectSingleProps) {
  return <SearchableSelect {...props} isMulti={false} />;
}

export default SearchableSelectSingle;
