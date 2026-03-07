import { Result, Ok, Err, isFailure } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export type MatrixGranularity = "week" | "fortnight" | "month" | "year";

export interface DateBucket {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isPartial: boolean;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toUtcDate = (value: Date | string): Date => {
  if (value instanceof Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }

  const parsed = new Date(value);
  return new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()),
  );
};

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * DAY_IN_MS);

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

const pad2 = (value: number): string => String(value).padStart(2, "0");

const getIsoWeekStart = (date: Date): Date => {
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(date, diffToMonday);
};

const getIsoWeekMeta = (date: Date): { week: number; isoYear: number } => {
  const weekStart = getIsoWeekStart(date);
  const thursday = addDays(weekStart, 3);
  const isoYear = thursday.getUTCFullYear();

  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4WeekStart = getIsoWeekStart(jan4);
  const week = Math.round((weekStart.getTime() - jan4WeekStart.getTime()) / (7 * DAY_IN_MS)) + 1;

  return { week, isoYear };
};

export class DateBucketService {
  generateBuckets(
    granularity: MatrixGranularity,
    startDate: Date | string,
    endDate: Date | string,
  ): Result<DateBucket[], DomainError> {
    const start = toUtcDate(startDate);
    const end = toUtcDate(endDate);

    if (start.getTime() > end.getTime()) {
      return Err(
        ErrorFactories.invalidDateRange(formatDate(start), formatDate(end)),
      );
    }

    const buckets: DateBucket[] = [];
    let current = start;

    while (current.getTime() <= end.getTime()) {
      const bucket = this.getBucketForUtcDate(granularity, current);
      if (isFailure(bucket)) {
        return bucket;
      }

      const currentBucket = {
        ...bucket.data,
        isPartial:
          toUtcDate(bucket.data.startDate).getTime() < start.getTime() ||
          toUtcDate(bucket.data.endDate).getTime() > end.getTime(),
      };

      buckets.push(currentBucket);
      current = addDays(toUtcDate(currentBucket.endDate), 1);
    }

    return Ok(buckets);
  }

  getBucketForDate(
    granularity: MatrixGranularity,
    date: Date | string,
  ): Result<DateBucket, DomainError> {
    return this.getBucketForUtcDate(granularity, toUtcDate(date));
  }

  private getBucketForUtcDate(
    granularity: MatrixGranularity,
    date: Date,
  ): Result<DateBucket, DomainError> {
    if (granularity === "week") {
      return Ok(this.buildWeekBucket(date));
    }

    if (granularity === "fortnight") {
      return Ok(this.buildFortnightBucket(date));
    }

    if (granularity === "month") {
      return Ok(this.buildMonthBucket(date));
    }

    if (granularity === "year") {
      return Ok(this.buildYearBucket(date));
    }

    return Err(ErrorFactories.invalidGranularity(granularity));
  }

  private buildWeekBucket(date: Date): DateBucket {
    const start = getIsoWeekStart(date);
    const end = addDays(start, 6);
    const { week, isoYear } = getIsoWeekMeta(start);

    return {
      id: `W${isoYear}-${pad2(week)}`,
      label: `Sem ${week}`,
      startDate: formatDate(start),
      endDate: formatDate(end),
      isPartial: false,
    };
  }

  private buildFortnightBucket(date: Date): DateBucket {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const monthNumber = month + 1;

    const isFirst = day <= 15;
    const start = isFirst
      ? new Date(Date.UTC(year, month, 1))
      : new Date(Date.UTC(year, month, 16));

    const end = isFirst
      ? new Date(Date.UTC(year, month, 15))
      : new Date(Date.UTC(year, month + 1, 0));

    return {
      id: `F${year}-${pad2(monthNumber)}-${isFirst ? "Q1" : "Q2"}`,
      label: `${pad2(monthNumber)} ${isFirst ? "Q1" : "Q2"}`,
      startDate: formatDate(start),
      endDate: formatDate(end),
      isPartial: false,
    };
  }

  private buildMonthBucket(date: Date): DateBucket {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const monthNumber = month + 1;
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));

    return {
      id: `M${year}-${pad2(monthNumber)}`,
      label: `${year}-${pad2(monthNumber)}`,
      startDate: formatDate(start),
      endDate: formatDate(end),
      isPartial: false,
    };
  }

  private buildYearBucket(date: Date): DateBucket {
    const year = date.getUTCFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));

    return {
      id: `Y${year}`,
      label: String(year),
      startDate: formatDate(start),
      endDate: formatDate(end),
      isPartial: false,
    };
  }
}

export const dateBucketService = new DateBucketService();
