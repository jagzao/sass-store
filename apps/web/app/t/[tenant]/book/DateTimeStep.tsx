"use client";

/**
 * STRY-021 PR1 — Date + time step (extracted from book-calendar-client).
 *
 * Purely presentational: renders the week carousel and the time slot grid.
 * All state lives in the parent. Behavior identical to the inline JSX.
 */
import { motion, type Variants } from "framer-motion";
import {
  CTV_CLAY_ORANGE,
  CTV_INK,
  CTV_MUTED,
} from "@/lib/design/centro-tenistico-brand";
import {
  WN_CHARCOAL,
  WN_GOLD,
  WN_LILAC_SPOTLIGHT,
} from "@/lib/design/wondernails-brand";
import { getOrdinal } from "@/lib/booking/book-date-format";

const WEEKDAY_SHORT = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const DAY_NUMBER = new Intl.DateTimeFormat("en-US", { day: "numeric" });

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function formatSlotLabel(slot: string) {
  const [h, m] = slot.split(":").map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return slot;
  const d = new Date(2000, 0, 1, h, m);
  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export interface DayInfo {
  iso: string;
  dayLabel: string;
  dateLabel: string;
  available: boolean;
  fullDate: Date;
}

export interface DateTimeStepProps {
  isCTV: boolean;
  isLuxury: boolean;
  isLightPanel: boolean;
  accent: string;
  monthTitle: string;
  carouselPage: number;
  weekDates: DayInfo[];
  selectedDate: string;
  availableSlots: string[];
  selectedTime: string;
  panelItem: Variants;
  onPrevDates: () => void;
  onNextDates: () => void;
  onSelectDate: (iso: string) => void;
  onSelectTime: (slot: string) => void;
}

export function DateTimeStep({
  isCTV,
  isLuxury,
  isLightPanel,
  accent,
  monthTitle,
  carouselPage,
  weekDates,
  selectedDate,
  availableSlots,
  selectedTime,
  panelItem,
  onPrevDates,
  onNextDates,
  onSelectDate,
  onSelectTime,
}: DateTimeStepProps) {
  return (
    <>
      {/* Date carousel */}
      <motion.div
        variants={panelItem}
        className={
          isLightPanel
            ? "px-4 sm:px-5 py-4 border-b border-stone-100"
            : "px-4 sm:px-5 py-4 border-b border-white/[0.06]"
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className={
                isLightPanel
                  ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/30"
                  : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/[0.06] disabled:opacity-25 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
              }
              aria-label="Previous dates"
              onClick={onPrevDates}
              disabled={carouselPage === 0}
            >
              <ChevronLeft />
            </button>
            <span
              className={
                isLightPanel
                  ? "text-[13px] font-medium tracking-[0.06em] capitalize text-center flex-1"
                  : "text-[13px] font-medium tracking-wide text-zinc-300 capitalize text-center flex-1"
              }
              style={
                isCTV
                  ? { color: CTV_INK }
                  : isLuxury
                    ? { color: WN_CHARCOAL }
                    : undefined
              }
            >
              {monthTitle}
            </span>
            <button
              type="button"
              className={
                isLightPanel
                  ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/30"
                  : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
              }
              aria-label="Next dates"
              onClick={onNextDates}
            >
              <ChevronRight />
            </button>
          </div>

          <div className={isLuxury ? "relative -mx-1 px-1 py-1" : undefined}>
            {isLuxury ? (
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-90"
                aria-hidden
                style={{ background: WN_LILAC_SPOTLIGHT }}
              />
            ) : null}
            <div
              className={
                isLightPanel
                  ? "relative flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:thin] [scrollbar-color:rgba(120,113,108,0.35)_transparent]"
                  : "flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
              }
            >
              {weekDates.map((day) => {
                const isSelected = selectedDate === day.iso;
                return (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => onSelectDate(day.iso)}
                    data-testid={`book-day-${day.iso}`}
                    className={`min-w-[4.75rem] shrink-0 rounded-xl px-2 py-2.5 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isLuxury
                        ? "focus-visible:ring-[#C5A059]/40 focus-visible:ring-offset-white"
                        : isCTV
                          ? "focus-visible:ring-[#B85C38]/40 focus-visible:ring-offset-white"
                          : "focus-visible:ring-[color:var(--book-accent)]/50 focus-visible:ring-offset-0"
                    } ${
                      isSelected
                        ? isLuxury
                          ? "border-2 border-[#C5A059] bg-white text-[#333333] shadow-[0_8px_24px_-8px_rgba(200,160,255,0.35)]"
                          : isCTV
                            ? "text-white shadow-md ring-1 ring-black/5"
                            : "text-white ring-1 ring-white/10"
                        : isLightPanel
                          ? "border border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:bg-stone-50/80"
                          : "border border-white/[0.1] bg-white/[0.03] text-white/80 hover:bg-white/[0.06] hover:border-white/[0.14]"
                    }`}
                    style={
                      isSelected && !isLuxury
                        ? {
                            backgroundColor: accent,
                            boxShadow: isCTV
                              ? `0 8px 22px -6px ${accent}55`
                              : `0 0 0 1px ${accent}, 0 8px 24px -6px rgba(0,0,0,0.45)`,
                          }
                        : undefined
                    }
                  >
                    <p
                      className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${
                        isSelected
                          ? isLuxury
                            ? "text-[#C5A059]"
                            : "text-white/90"
                          : isLightPanel
                            ? "text-stone-500"
                            : "text-white/70"
                      }`}
                    >
                      {day.dayLabel}
                    </p>
                    <p
                      className={`text-[15px] font-semibold tabular-nums leading-tight mt-0.5 ${
                        isLightPanel && (!isSelected || isLuxury)
                          ? "text-stone-900"
                          : ""
                      }`}
                    >
                      {day.dateLabel}
                    </p>
                    <p
                      className={`text-[9px] mt-1 font-normal ${
                        isSelected
                          ? isLuxury
                            ? "text-gray-500"
                            : "text-white/80"
                          : isLightPanel
                            ? "text-stone-400"
                            : "text-white/50"
                      }`}
                    >
                      {day.available ? "Libre" : "Ocupado"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Time slots */}
      <motion.div
        variants={panelItem}
        className={
          isLightPanel
            ? "px-4 sm:px-5 py-4 border-b border-stone-100"
            : "px-4 sm:px-5 py-4 border-b border-white/[0.06]"
        }
      >
        <h2
          className={
            isLightPanel
              ? "text-[11px] font-semibold uppercase tracking-[0.2em] mb-3"
              : "text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500 mb-3"
          }
          style={
            isCTV
              ? { color: CTV_MUTED }
              : isLuxury
                ? { color: WN_GOLD }
                : undefined
          }
        >
          Horarios disponibles
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {availableSlots.map((slot) => {
            const isSelected = selectedTime === slot;
            return (
              <button
                key={slot}
                type="button"
                data-testid={`book-time-${slot}`}
                onClick={() => onSelectTime(slot)}
                className={`rounded-xl border py-2.5 text-[12px] sm:text-[13px] font-semibold tabular-nums transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/40 ${
                  isLuxury
                    ? isSelected
                      ? "border-2 border-[#C5A059] bg-[#C5A059]/10 text-[#333333] shadow-sm"
                      : "border border-[#C5A059]/45 bg-white text-[#333333] hover:bg-[#C5A059]/5 hover:border-[#C5A059]"
                    : isCTV
                      ? isSelected
                        ? "border-transparent text-white shadow-md"
                        : "border-stone-200 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-300"
                      : isSelected
                        ? "border-transparent text-white shadow-sm focus-visible:ring-offset-0"
                        : "border-white/[0.1] bg-white/[0.03] text-white/88 hover:bg-white/[0.07] hover:border-white/[0.12] focus-visible:ring-offset-0"
                }`}
                style={
                  isSelected && !isLuxury
                    ? {
                        backgroundColor: accent,
                        boxShadow: isCTV
                          ? `0 6px 18px -6px ${accent}66`
                          : `inset 0 1px 0 0 rgba(255,255,255,0.12)`,
                      }
                    : undefined
                }
              >
                {formatSlotLabel(slot)}
              </button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

export { WEEKDAY_SHORT, DAY_NUMBER, getOrdinal };
