/**
 * Pure nail quote calculation.
 * No side effects, no try/catch — returns Result.
 */

import { Result, Ok, Err } from "@sass-store/core/src/result";
import {
  ValidationError,
  ErrorFactories,
} from "@sass-store/core/src/errors/types";
import {
  NailQuoteOption,
  NailQuoteCalculation,
  NailQuoteLine,
  NailOptionCategory,
} from "./types";

export type {
  NailQuoteOption,
  NailQuoteCalculation,
  NailQuoteLine,
  NailOptionCategory,
};

const BASE_CATEGORIES: NailOptionCategory[] = ["material", "length", "shape"];

export const calculateNailQuote = (
  selectedOptionIds: string[],
  catalog: NailQuoteOption[],
): Result<NailQuoteCalculation, ValidationError> => {
  if (!Array.isArray(selectedOptionIds)) {
    return Err(
      ErrorFactories.validation(
        "Las opciones seleccionadas deben ser un arreglo",
        "options",
      ),
    );
  }

  const selectedSet = new Set(selectedOptionIds);
  const selectedOptions = catalog.filter(
    (o) => selectedSet.has(o.id) && o.isActive,
  );

  // Validate all selected options exist in catalog
  if (selectedOptions.length !== selectedSet.size) {
    const missing = selectedOptionIds.filter(
      (id) => !catalog.some((o) => o.id === id && o.isActive),
    );
    return Err(
      ErrorFactories.validation(
        `Opciones no validas o inactivas: ${missing.join(", ")}`,
        "options",
        missing,
      ),
    );
  }

  // Validate base categories: exactly one of each required category
  for (const category of BASE_CATEGORIES) {
    const count = selectedOptions.filter((o) => o.category === category).length;
    if (count === 0) {
      return Err(
        ErrorFactories.validation(
          `Debes seleccionar una opcion de ${category}`,
          category,
        ),
      );
    }
    if (count > 1) {
      return Err(
        ErrorFactories.validation(
          `Solo puedes seleccionar una opcion de ${category}`,
          category,
        ),
      );
    }
  }

  const lines: NailQuoteLine[] = selectedOptions.map((o) => ({
    optionId: o.id,
    category: o.category,
    key: o.key,
    label: o.label,
    unitPrice: o.basePrice,
    durationMinutes: o.baseDurationMinutes,
  }));

  const total = lines.reduce((sum, line) => sum + line.unitPrice, 0);
  const durationMinutes = lines.reduce(
    (sum, line) => sum + line.durationMinutes,
    0,
  );

  return Ok({ total, durationMinutes, lines });
};

export const formatNailQuoteDuration = (minutes: number): string => {
  if (minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
};

export const formatNailQuotePrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(0)}`;
};
