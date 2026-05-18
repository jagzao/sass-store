import { getDay } from "date-fns";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface TimeRange {
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface OperatingHoursConfig {
  intervalMinutes: number;
  days: Record<DayKey, TimeRange[]>;
}

export const DAY_KEYS: DayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo",
};

/** JS getDay(): 0=Sun … 6=Sat */
const JS_DAY_TO_KEY: DayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

export function dayKeyFromDate(date: Date): DayKey {
  return JS_DAY_TO_KEY[getDay(date)];
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function defaultOperatingHours(): OperatingHoursConfig {
  return {
    intervalMinutes: 30,
    days: {
      mon: [
        { start: "09:00", end: "13:00" },
        { start: "16:00", end: "21:00" },
      ],
      tue: [
        { start: "09:00", end: "13:00" },
        { start: "16:00", end: "21:00" },
      ],
      wed: [{ start: "13:00", end: "21:00" }],
      thu: [{ start: "13:00", end: "21:00" }],
      fri: [{ start: "13:00", end: "21:00" }],
      sat: [{ start: "13:00", end: "21:00" }],
      sun: [{ start: "09:00", end: "13:00" }],
    },
  };
}

export function getRangesForDate(
  config: OperatingHoursConfig,
  date: Date,
): TimeRange[] {
  return config.days[dayKeyFromDate(date)] ?? [];
}

export function isTimeInRanges(time: string, ranges: TimeRange[]): boolean {
  if (ranges.length === 0) return false;
  const t = parseTimeToMinutes(time);
  return ranges.some((r) => {
    const start = parseTimeToMinutes(r.start);
    const end = parseTimeToMinutes(r.end);
    return t >= start && t < end;
  });
}

export function buildTimeSlotsForDay(
  config: OperatingHoursConfig,
  date: Date,
): { time: string; isOpen: boolean }[] {
  const ranges = getRangesForDate(config, date);
  if (ranges.length === 0) return [];

  const interval = config.intervalMinutes;
  let minStart = Infinity;
  let maxEnd = -Infinity;
  for (const r of ranges) {
    minStart = Math.min(minStart, parseTimeToMinutes(r.start));
    maxEnd = Math.max(maxEnd, parseTimeToMinutes(r.end));
  }

  const slots: { time: string; isOpen: boolean }[] = [];
  for (let m = minStart; m < maxEnd; m += interval) {
    const time = minutesToTime(m);
    slots.push({ time, isOpen: isTimeInRanges(time, ranges) });
  }
  return slots;
}

export function getGridBounds(
  config: OperatingHoursConfig,
  date: Date,
): { startMinutes: number; endMinutes: number } | null {
  const ranges = getRangesForDate(config, date);
  if (ranges.length === 0) return null;

  let minStart = Infinity;
  let maxEnd = -Infinity;
  for (const r of ranges) {
    minStart = Math.min(minStart, parseTimeToMinutes(r.start));
    maxEnd = Math.max(maxEnd, parseTimeToMinutes(r.end));
  }
  return { startMinutes: minStart, endMinutes: maxEnd };
}
