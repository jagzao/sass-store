"use client";

import React from "react";
import {
  SearchableSelect,
  SearchableSelectProps,
  SelectOption,
} from "./SearchableSelect";

/**
 * SearchableSelectMulti
 *
 * Wrapper para multi-select (selección múltiple) con búsqueda.
 * Simplifica el uso de SearchableSelect para casos donde se permite seleccionar múltiples opciones.
 *
 * @example
 * ```tsx
 * <SearchableSelectMulti
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' },
 *     { value: '3', label: 'Option 3' }
 *   ]}
 *   value={['1', '2']}
 *   onChange={(options) => console.log(options)}
 *   label="Select multiple options"
 * />
 * ```
 */

export interface SearchableSelectMultiProps extends Omit<
  SearchableSelectProps<true>,
  "isMulti"
> {}

export function SearchableSelectMulti(props: SearchableSelectMultiProps) {
  return <SearchableSelect {...props} isMulti={true} />;
}

export default SearchableSelectMulti;
