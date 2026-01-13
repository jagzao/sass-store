"use client";

import React from "react";
import {
  SearchableSelect,
  SearchableSelectProps,
  SelectOption,
} from "./SearchableSelect";

/**
 * AsyncSearchableSelect
 *
 * Wrapper para búsqueda asíncrona desde API.
 * Permite cargar opciones dinámicamente mientras el usuario escribe.
 *
 * @example
 * ```tsx
 * <AsyncSearchableSelect
 *   apiEndpoint="/api/users/search"
 *   value="user-123"
 *   onChange={(option) => console.log(option)}
 *   label="Search users"
 *   placeholder="Type to search..."
 * />
 * ```
 *
 * @example Con transformación personalizada
 * ```tsx
 * <AsyncSearchableSelect
 *   loadOptions={async (inputValue) => {
 *     const response = await fetch(`/api/search?q=${inputValue}`);
 *     const data = await response.json();
 *     return data.results.map(item => ({
 *       value: item.id,
 *       label: item.name
 *     }));
 *   }}
 *   value="item-1"
 *   onChange={(option) => console.log(option)}
 * />
 * ```
 */

export interface AsyncSearchableSelectProps<
  IsMulti extends boolean = false,
> extends Omit<SearchableSelectProps<IsMulti>, "options" | "loadOptions"> {
  /**
   * API endpoint to fetch options from.
   * The component will append `?q={searchTerm}` to this URL.
   */
  apiEndpoint?: string;

  /**
   * Custom function to load options.
   * If provided, this takes precedence over apiEndpoint.
   */
  loadOptions?: (inputValue: string) => Promise<SelectOption[]>;

  /**
   * Transform function to convert API response to SelectOption format.
   * Only used when apiEndpoint is provided.
   */
  transformResponse?: (data: any) => SelectOption[];

  /**
   * Options to show initially before user types.
   */
  defaultOptions?: boolean | SelectOption[];

  /**
   * Debounce delay in milliseconds for API calls.
   * Default: 300ms
   */
  debounceDelay?: number;
}

export function AsyncSearchableSelect<IsMulti extends boolean = false>(
  props: AsyncSearchableSelectProps<IsMulti>,
) {
  const {
    apiEndpoint,
    loadOptions: customLoadOptions,
    transformResponse = (data) => data,
    defaultOptions = true,
    debounceDelay = 300,
    ...rest
  } = props;

  // Create debounced load function
  const loadOptionsWithDebounce = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    return (inputValue: string): Promise<SelectOption[]> => {
      return new Promise((resolve) => {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(async () => {
          try {
            if (customLoadOptions) {
              const options = await customLoadOptions(inputValue);
              resolve(options);
            } else if (apiEndpoint) {
              const url = `${apiEndpoint}${apiEndpoint.includes("?") ? "&" : "?"}q=${encodeURIComponent(inputValue)}`;
              const response = await fetch(url);

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const data = await response.json();
              const transformedData = transformResponse(data);
              resolve(transformedData);
            } else {
              resolve([]);
            }
          } catch (error) {
            console.error("Error loading options:", error);
            resolve([]);
          }
        }, debounceDelay);
      });
    };
  }, [apiEndpoint, customLoadOptions, transformResponse, debounceDelay]);

  return (
    <SearchableSelect
      {...rest}
      loadOptions={loadOptionsWithDebounce}
      defaultOptions={defaultOptions}
    />
  );
}

export default AsyncSearchableSelect;
