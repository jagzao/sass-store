import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export interface RetouchConfig {
  frequencyType: "days" | "weeks" | "months";
  frequencyValue: number;
  businessDaysOnly: boolean;
}

export interface RetouchCalculationInput {
  lastVisitDate: Date;
  config: RetouchConfig;
  holidays: Date[];
}

export class InMemoryRetouchService {
  static calculateRetouchDate(
    lastVisitDate: Date,
    { frequencyType, frequencyValue, businessDaysOnly }: RetouchConfig,
    holidays: Date[],
  ): Date {
    const holidaySet = new Set(
      holidays.map((h) => h.toISOString().split("T")[0]),
    );

    const baseDate = new Date(lastVisitDate);
    const nextDate = new Date(baseDate);

    // Mapeo de frecuencia
    switch (frequencyType) {
      case "days":
        nextDate.setDate(baseDate.getDate() + frequencyValue);
        break;
      case "weeks":
        nextDate.setDate(baseDate.getDate() + frequencyValue * 7);
        break;
      case "months":
        nextDate.setMonth(baseDate.getMonth() + frequencyValue);
        break;
      default:
        throw new Error(`Unknown frequency type: ${frequencyType}`);
    }

    // Ajustar solo días hábiles si se indica
    if (businessDaysOnly) {
      while (
        nextDate.getDay() === 0 ||
        nextDate.getDay() === 6 ||
        holidaySet.has(nextDate.toISOString().split("T")[0])
      ) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    }

    return nextDate;
  }

  static validateConfig(config: RetouchConfig): Result<void, DomainError> {
    if (config.frequencyValue <= 0 || config.frequencyValue % 1 !== 0) {
      return Err(
        ErrorFactories.validation(
          "Frequency value must be a positive integer",
          "frequencyValue",
        ),
      );
    }
    const validTypes = ["days", "weeks", "months"];
    if (!validTypes.includes(config.frequencyType)) {
      return Err(
        ErrorFactories.validation(
          "Frequency type must be days, weeks, or months",
          "frequencyType",
        ),
      );
    }
    return Ok(undefined);
  }

  static isOverdue(nextRetouchDate: Date, referenceDate = new Date()): boolean {
    return referenceDate > nextRetouchDate;
  }
}
