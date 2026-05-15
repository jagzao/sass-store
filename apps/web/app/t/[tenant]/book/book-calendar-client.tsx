"use client";

import { FormEvent, useMemo, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { getOrdinal } from "@/lib/booking/book-date-format";
import { SearchableSelectSingle } from "@/components/ui/forms/SearchableSelectSingle";
import type { SelectOption } from "@/components/ui/forms/SearchableSelect";
import {
  CTV_CLAY_ORANGE,
  CTV_INK,
  CTV_MUTED,
} from "@/lib/design/centro-tenistico-brand";

/**
 * CTV: mismo lenguaje visual que el hero (menta #F0FDF4, rejilla, serif, arcilla #B85C38).
 * Otros tenants: panel oscuro tipo “night booking”.
 */
export interface BookServiceOption {
  id: string;
  name?: string;
  duration: number;
  price: number;
}

interface BookCalendarClientProps {
  tenantSlug: string;
  primaryColor: string;
  services: BookServiceOption[];
  defaultStaffId?: string;
}

const ALL_TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const WEEKDAY_SHORT = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const DAY_NUMBER = new Intl.DateTimeFormat("en-US", { day: "numeric" });
const MONTH_TITLE = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const modalEnter = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

const panelStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const panelItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function formatSlotLabel(slot: string) {
  const [h, m] = slot.split(":").map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return slot;
  const d = new Date(2000, 0, 1, h, m);
  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Formatea dígitos de teléfono a (XXX) XXX-XXXX para mejor UX; si >10 dígitos usa +X (XXX) XXX-XXXX */
function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

const priceMx = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);

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

function serviceLabel(s: BookServiceOption) {
  const title = s.name?.trim();
  return title && title.length > 0 ? title : `Servicio`;
}

export function BookCalendarClient({
  tenantSlug,
  primaryColor,
  services,
  defaultStaffId,
}: BookCalendarClientProps) {
  const { data: session, status: sessionStatus } = useSession();
  const isAuthed = sessionStatus === "authenticated" && Boolean(session?.user);
  const showGuestFields = !isAuthed;

  const isCTV = tenantSlug === "centro-tenistico";
  const accent = isCTV ? CTV_CLAY_ORANGE : primaryColor;

  const [selectedServiceId, setSelectedServiceId] = useState(
    () => services[0]?.id ?? "",
  );

  const selectedService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) ?? services[0];
  }, [services, selectedServiceId]);

  const serviceOptions: SelectOption[] = useMemo(
    () =>
      services.map((s) => ({
        value: s.id,
        label: serviceLabel(s),
      })),
    [services],
  );

  const todayDate = useMemo(() => new Date(), []);
  const today = useMemo(
    () => todayDate.toISOString().split("T")[0],
    [todayDate],
  );

  const [selectedDate, setSelectedDate] = useState(today);
  const [carouselPage, setCarouselPage] = useState(0);
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const weekDates = useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => {
      const day = new Date(todayDate);
      day.setDate(todayDate.getDate() + carouselPage * 5 + index);
      const iso = day.toISOString().split("T")[0];
      const dayNumber = DAY_NUMBER.format(day);

      return {
        iso,
        dayLabel: WEEKDAY_SHORT.format(day),
        dateLabel: `${dayNumber}${getOrdinal(dayNumber)}`,
        available: true,
        fullDate: day,
      };
    });
  }, [todayDate, carouselPage]);

  const availableSlots = useMemo(() => {
    if (selectedDate !== today) {
      return ALL_TIME_SLOTS;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;

    return ALL_TIME_SLOTS.filter((slot) => slot > currentTime);
  }, [selectedDate, today]);

  const monthTitle = useMemo(() => {
    const selected = weekDates.find((day) => day.iso === selectedDate);
    return MONTH_TITLE.format(selected?.fullDate || todayDate);
  }, [selectedDate, todayDate, weekDates]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedTime) {
      setErrorMessage("Selecciona un horario disponible.");
      return;
    }

    if (!selectedService) {
      setErrorMessage("Selecciona un servicio.");
      return;
    }

    if (!isAuthed) {
      if (!customerName.trim() || !customerPhone.replace(/\D/g, "").trim()) {
        setErrorMessage("Completa nombre y teléfono.");
        return;
      }
    }

    setIsSubmitting(true);

    const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const endTime = new Date(
      startTime.getTime() + selectedService.duration * 60 * 1000,
    );

    try {
      const response = await fetch(`/api/tenants/${tenantSlug}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          staffId: defaultStaffId,
          customerName: isAuthed
            ? (
                session?.user?.name ||
                session?.user?.email?.split("@")[0] ||
                "Usuario"
              ).trim()
            : customerName.trim(),
          customerPhone: isAuthed
            ? customerPhone.replace(/\D/g, "").trim() || undefined
            : customerPhone.replace(/\D/g, "").trim(),
          customerEmail: isAuthed
            ? session?.user?.email || undefined
            : customerEmail.trim() || undefined,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: notes.trim() || undefined,
          totalPrice: selectedService.price,
          status: "pending",
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setErrorMessage(payload?.error || "No se pudo agendar la cita.");
        return;
      }

      setSuccessMessage(
        "Cita agendada correctamente. El admin del tenant ya fue notificado.",
      );
      setSelectedTime("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setNotes("");
    } catch (error) {
      console.error("Error creating booking:", error);
      setErrorMessage("Ocurrio un error al agendar. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviousDates = () => {
    if (carouselPage === 0) return;
    const nextPage = carouselPage - 1;
    setCarouselPage(nextPage);

    const firstDate = new Date(todayDate);
    firstDate.setDate(todayDate.getDate() + nextPage * 5);
    setSelectedDate(firstDate.toISOString().split("T")[0]);
  };

  const handleNextDates = () => {
    const nextPage = carouselPage + 1;
    setCarouselPage(nextPage);

    const firstDate = new Date(todayDate);
    firstDate.setDate(todayDate.getDate() + nextPage * 5);
    setSelectedDate(firstDate.toISOString().split("T")[0]);
  };

  const rootStyle = useMemo((): CSSProperties => {
    const vars: CSSProperties & Record<string, string> = {
      "--book-accent": accent,
    };
    if (isCTV) {
      vars.fontFamily =
        'ui-serif, "Palatino Linotype", Palatino, "Book Antiqua", Georgia, Cambria, serif';
    } else {
      vars.fontFamily =
        'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    }
    return vars;
  }, [accent, isCTV]);

  const inputClass = isCTV
    ? "w-full rounded-xl px-3 py-2.5 text-sm bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/35 focus-visible:border-stone-300 transition-shadow"
    : "w-full rounded-lg px-3 py-2.5 text-sm bg-zinc-900/80 border border-white/[0.1] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/45 focus-visible:border-white/15";

  const lightInputClass =
    "w-full rounded-lg px-3 py-2.5 text-sm bg-zinc-50 border border-zinc-200/90 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/35 focus-visible:border-zinc-300 transition-shadow";

  const serviceMeta = selectedService
    ? `${selectedService.duration} min · ${priceMx(selectedService.price)}`
    : "";

  return (
    <div
      className="max-w-lg mx-auto w-full antialiased"
      data-testid="book-flow-root"
      style={rootStyle}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8">
        <motion.div
          {...modalEnter}
          data-testid="book-session-panel"
          className={
            isCTV
              ? "relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white/95 shadow-[0_20px_50px_-24px_rgba(31,41,55,0.12),0_1px_0_0_rgba(255,255,255,0.8)_inset]"
              : "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/85 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-xl ring-1 ring-white/[0.04]"
          }
        >
          {!isCTV ? (
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              aria-hidden
              style={{
                backgroundImage: `repeating-linear-gradient(125deg, transparent, transparent 14px, rgba(255,255,255,0.02) 14px, rgba(255,255,255,0.02) 15px)`,
              }}
            />
          ) : (
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.5]"
              aria-hidden
              style={{
                background:
                  "linear-gradient(180deg, rgba(184,92,56,0.04) 0%, transparent 42%)",
              }}
            />
          )}
          <div className="relative h-px w-full bg-gradient-to-r from-transparent via-[color:var(--book-accent)]/55 to-transparent" />

          <motion.div
            className="relative"
            variants={panelStagger}
            initial="hidden"
            animate="show"
          >
            {/* Header */}
            <motion.header
              variants={panelItem}
              className={
                isCTV
                  ? "px-5 pt-5 pb-4 border-b border-stone-100"
                  : "px-5 pt-5 pb-4 border-b border-white/[0.08]"
              }
            >
              <div data-testid="book-service-select">
                <SearchableSelectSingle
                  placeholder="Buscar servicio..."
                  isClearable={false}
                  options={serviceOptions}
                  value={
                    selectedService
                      ? {
                          value: selectedService.id,
                          label: serviceLabel(selectedService),
                        }
                      : undefined
                  }
                  onChange={(v) => {
                    const opt = v as SelectOption | null;
                    if (!opt || typeof opt !== "object") return;
                    setSelectedServiceId(String(opt.value));
                  }}
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : undefined
                  }
                />
              </div>
              <p
                className="text-[11px] sm:text-xs mt-3 tracking-wide"
                style={isCTV ? { color: CTV_MUTED } : undefined}
              >
                {!isCTV ? (
                  <span className="text-zinc-500">{serviceMeta}</span>
                ) : (
                  serviceMeta
                )}
              </p>
            </motion.header>

            {/* Date carousel */}
            <motion.div
              variants={panelItem}
              className={
                isCTV
                  ? "px-4 sm:px-5 py-4 border-b border-stone-100"
                  : "px-4 sm:px-5 py-4 border-b border-white/[0.06]"
              }
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className={
                      isCTV
                        ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-800 disabled:opacity-30 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/30"
                        : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/[0.06] disabled:opacity-25 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                    }
                    aria-label="Previous dates"
                    onClick={handlePreviousDates}
                    disabled={carouselPage === 0}
                  >
                    <ChevronLeft />
                  </button>
                  <span
                    className={
                      isCTV
                        ? "text-[13px] font-medium tracking-[0.06em] capitalize text-center flex-1"
                        : "text-[13px] font-medium tracking-wide text-zinc-300 capitalize text-center flex-1"
                    }
                    style={isCTV ? { color: CTV_INK } : undefined}
                  >
                    {monthTitle}
                  </span>
                  <button
                    type="button"
                    className={
                      isCTV
                        ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/30"
                        : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                    }
                    aria-label="Next dates"
                    onClick={handleNextDates}
                  >
                    <ChevronRight />
                  </button>
                </div>

                <div
                  className={
                    isCTV
                      ? "flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 [scrollbar-width:thin] [scrollbar-color:rgba(120,113,108,0.35)_transparent]"
                      : "flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
                  }
                >
                  {weekDates.map((day) => {
                    const isSelected = selectedDate === day.iso;
                    return (
                      <button
                        key={day.iso}
                        type="button"
                        onClick={() => setSelectedDate(day.iso)}
                        data-testid={`book-day-${day.iso}`}
                        className={`min-w-[4.75rem] shrink-0 rounded-xl px-2 py-2.5 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                          isCTV
                            ? "focus-visible:ring-[#B85C38]/40 focus-visible:ring-offset-white"
                            : "focus-visible:ring-[color:var(--book-accent)]/50 focus-visible:ring-offset-0"
                        } ${
                          isSelected
                            ? isCTV
                              ? "text-white shadow-md ring-1 ring-black/5"
                              : "text-white ring-1 ring-white/10"
                            : isCTV
                              ? "border border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:bg-stone-50/80"
                              : "border border-white/[0.1] bg-white/[0.03] text-white/80 hover:bg-white/[0.06] hover:border-white/[0.14]"
                        }`}
                        style={
                          isSelected
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
                              ? "text-white/90"
                              : isCTV
                                ? "text-stone-500"
                                : "text-white/70"
                          }`}
                        >
                          {day.dayLabel}
                        </p>
                        <p
                          className={`text-[15px] font-semibold tabular-nums leading-tight mt-0.5 ${
                            !isSelected && isCTV ? "text-stone-900" : ""
                          }`}
                        >
                          {day.dateLabel}
                        </p>
                        <p
                          className={`text-[9px] mt-1 font-normal ${
                            isSelected
                              ? "text-white/80"
                              : isCTV
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
            </motion.div>

            {/* Time slots */}
            <motion.div
              variants={panelItem}
              className={
                isCTV
                  ? "px-4 sm:px-5 py-4 border-b border-stone-100"
                  : "px-4 sm:px-5 py-4 border-b border-white/[0.06]"
              }
            >
              <h2
                className={
                  isCTV
                    ? "text-[11px] font-semibold uppercase tracking-[0.2em] mb-3"
                    : "text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500 mb-3"
                }
                style={isCTV ? { color: CTV_MUTED } : undefined}
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
                      onClick={() => setSelectedTime(slot)}
                      className={`rounded-xl border py-2.5 text-[12px] sm:text-[13px] font-semibold tabular-nums transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/40 ${
                        isCTV
                          ? isSelected
                            ? "border-transparent text-white shadow-md"
                            : "border-stone-200 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-300"
                          : isSelected
                            ? "border-transparent text-white shadow-sm focus-visible:ring-offset-0"
                            : "border-white/[0.1] bg-white/[0.03] text-white/88 hover:bg-white/[0.07] hover:border-white/[0.12] focus-visible:ring-offset-0"
                      }`}
                      style={
                        isSelected
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

            {/* Summary + CTA */}
            <motion.footer
              variants={panelItem}
              className={
                isCTV
                  ? "px-4 sm:px-5 py-5 bg-stone-50/90"
                  : "px-4 sm:px-5 py-5 bg-black/[0.15]"
              }
            >
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="book-submit"
                className={
                  isCTV
                    ? "w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-45 disabled:cursor-not-allowed transition-[transform,box-shadow,filter] duration-200 ease-out hover:brightness-[1.05] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white shadow-[0_10px_28px_-8px_rgba(184,92,56,0.55)]"
                    : "w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-45 disabled:cursor-not-allowed transition-[transform,box-shadow,filter] duration-200 ease-out hover:brightness-[1.06] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.5)]"
                }
                style={{ backgroundColor: accent }}
              >
                {isSubmitting ? "Reservando…" : "Reservar ahora"}
              </button>
            </motion.footer>
          </motion.div>
        </motion.div>

        {showGuestFields ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.08,
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={
              isCTV
                ? "rounded-2xl border border-stone-200/90 bg-white/95 p-5 sm:p-6 shadow-[0_16px_40px_-28px_rgba(31,41,55,0.15)]"
                : "rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm"
            }
            data-testid="book-customer-fields"
            style={isCTV ? { color: CTV_INK } : undefined}
          >
            <h3
              className={
                isCTV
                  ? "mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]"
                  : "mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500"
              }
              style={isCTV ? { color: CTV_MUTED } : undefined}
            >
              Tus datos
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className={isCTV ? inputClass : lightInputClass}
                placeholder="Nombre completo"
                data-testid="book-customer-name"
                required
              />
              <input
                ref={(node) => {
                  if (!node) return;
                  // keep caret at logical digit position after format re-render
                  const raw = node.value;
                  const digitsBefore = raw
                    .slice(0, node.selectionStart || 0)
                    .replace(/\D/g, "").length;
                  const formatted = formatPhoneDisplay(customerPhone);
                  if (raw !== formatted) {
                    let newPos = 0;
                    let count = 0;
                    for (let i = 0; i < formatted.length; i++) {
                      if (/\d/.test(formatted[i])) count++;
                      newPos = i + 1;
                      if (count >= digitsBefore) break;
                    }
                    requestAnimationFrame(() => {
                      node.setSelectionRange(newPos, newPos);
                    });
                  }
                }}
                type="tel"
                inputMode="numeric"
                value={formatPhoneDisplay(customerPhone)}
                onChange={(event) => {
                  const raw = event.target.value;
                  const digits = raw.replace(/\D/g, "").slice(0, 15);
                  setCustomerPhone(digits);
                }}
                className={isCTV ? inputClass : lightInputClass}
                placeholder="Teléfono"
                data-testid="book-customer-phone"
                required
              />
              <input
                type="email"
                value={customerEmail}
                onChange={(event) => {
                  const email = event.target.value.toLowerCase().trimStart();
                  setCustomerEmail(email);
                }}
                onBlur={() => {
                  setCustomerEmail((prev) => prev.trim());
                }}
                className={isCTV ? inputClass : lightInputClass}
                placeholder="Email (opcional)"
                data-testid="book-customer-email"
              />
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className={`${isCTV ? inputClass : lightInputClass} resize-none`}
                placeholder="Notas (opcional)"
                data-testid="book-customer-notes"
                rows={3}
              />
            </div>

            {errorMessage ? (
              <p
                className={`text-sm mt-3 ${isCTV ? "text-red-700" : "text-red-400"}`}
                data-testid="book-error"
              >
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p
                className={`text-sm mt-3 ${isCTV ? "text-emerald-700" : "text-emerald-500"}`}
                data-testid="book-success"
              >
                {successMessage}
              </p>
            ) : null}
          </motion.div>
        ) : (
          <>
            {errorMessage ? (
              <p
                className={`text-sm max-w-lg mx-auto ${isCTV ? "text-red-700" : "text-red-400"}`}
                data-testid="book-error"
              >
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p
                className={`text-sm max-w-lg mx-auto ${isCTV ? "text-emerald-700" : "text-emerald-500"}`}
                data-testid="book-success"
              >
                {successMessage}
              </p>
            ) : null}
          </>
        )}
      </form>
    </div>
  );
}
