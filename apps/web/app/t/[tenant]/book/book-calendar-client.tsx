"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { getOrdinal } from "@/lib/booking/book-date-format";
import type { SelectOption } from "@/components/ui/forms/SearchableSelect";
import { CTV_CLAY_ORANGE } from "@/lib/design/centro-tenistico-brand";
import { WN_GOLD } from "@/lib/design/wondernails-brand";
import { ServiceStep } from "./ServiceStep";
import { DateTimeStep, WEEKDAY_SHORT, DAY_NUMBER } from "./DateTimeStep";
import { CustomerConfirmStep } from "./CustomerConfirmStep";

/**
 * CTV: mismo lenguaje visual que el hero (menta #F0FDF4, rejilla, serif, arcilla #B85C38).
 * Otros tenants: panel oscuro “night booking”.
 *
 * STRY-021 PR1 — The 3 sections are now rendered by ServiceStep, DateTimeStep
 * and CustomerConfirmStep. This parent owns all state and remains the single
 * orchestrator. The DOM output is byte-identical to the pre-refactor version
 * (smoke E2E selectors preserved).
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
  const isLuxury = tenantSlug === "wondernails";
  const isLightPanel = isCTV || isLuxury;
  const accent = isCTV ? CTV_CLAY_ORANGE : isLuxury ? WN_GOLD : primaryColor;

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
  const [customerMatches, setCustomerMatches] = useState<
    {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      reasons: string[];
    }[]
  >([]);
  const [linkedCustomerId, setLinkedCustomerId] = useState<string | null>(null);

  // SC-04: X-Idempotency-Key emitida por el backend al montar. Previene
  // duplicados por doble submit y permite replay seguro en caso de retry.
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = sessionStorage.getItem(`bk:idem:${tenantSlug}`);
        if (cached) {
          if (!cancelled) setIdempotencyKey(cached);
          return;
        }
        const r = await fetch(
          `/api/tenants/${tenantSlug}/book/idempotency-key`,
        );
        if (!r.ok) return;
        const json = await r.json();
        const key = json?.data?.key;
        if (key && !cancelled) {
          setIdempotencyKey(key);
          sessionStorage.setItem(`bk:idem:${tenantSlug}`, key);
        }
      } catch {
        // fail-open: sin key el POST sigue funcionando, solo sin idempotencia
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const runCustomerMatch = useCallback(async () => {
    if (isAuthed || !showGuestFields) return;
    const phone = customerPhone.replace(/\D/g, "");
    if (!customerName.trim() && !phone && !customerEmail.trim()) {
      setCustomerMatches([]);
      return;
    }
    const params = new URLSearchParams();
    if (customerName.trim()) params.set("name", customerName.trim());
    if (customerEmail.trim()) params.set("email", customerEmail.trim());
    if (phone) params.set("phone", phone);
    try {
      const res = await fetch(
        `/api/tenants/${tenantSlug}/customers/match?${params}`,
      );
      if (!res.ok) return;
      const json = await res.json();
      setCustomerMatches(json.data?.matches ?? []);
      if (json.data?.suggestedCustomerId && !linkedCustomerId) {
        setLinkedCustomerId(json.data.suggestedCustomerId);
      }
    } catch {
      setCustomerMatches([]);
    }
  }, [
    customerEmail,
    customerName,
    customerPhone,
    isAuthed,
    linkedCustomerId,
    showGuestFields,
    tenantSlug,
  ]);

  useEffect(() => {
    const t = setTimeout(() => {
      void runCustomerMatch();
    }, 400);
    return () => clearTimeout(t);
  }, [runCustomerMatch]);

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
          ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          staffId: defaultStaffId,
          customerId: !isAuthed ? linkedCustomerId || undefined : undefined,
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
          status: "confirmed",
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
      // SC-04: invalidar key tras éxito para que un nuevo submit use key nueva.
      if (idempotencyKey) {
        sessionStorage.removeItem(`bk:idem:${tenantSlug}`);
        setIdempotencyKey("");
      }
      setSelectedTime("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setNotes("");
      setLinkedCustomerId(null);
      setCustomerMatches([]);
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
    } else if (!isLuxury) {
      vars.fontFamily =
        'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    }
    return vars;
  }, [accent, isCTV, isLuxury]);

  const inputClass = isCTV
    ? "w-full rounded-xl px-3 py-2.5 text-sm bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/35 focus-visible:border-stone-300 transition-shadow"
    : isLuxury
      ? "w-full rounded-lg px-3 py-2.5 text-sm bg-white border border-[#333333]/20 text-[#333333] placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]/35 focus-visible:border-[#C5A059]/50 transition-shadow"
      : "w-full rounded-lg px-3 py-2.5 text-sm bg-zinc-900/80 border border-white/[0.1] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/45 focus-visible:border-white/15";

  const lightInputClass = isLuxury
    ? inputClass
    : "w-full rounded-lg px-3 py-2.5 text-sm bg-zinc-50 border border-zinc-200/90 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/35 focus-visible:border-zinc-300 transition-shadow";

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
              : isLuxury
                ? "relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_20px_50px_-24px_rgba(160,130,180,0.12)]"
                : "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/85 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-xl ring-1 ring-white/[0.04]"
          }
        >
          {!isLightPanel ? (
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              aria-hidden
              style={{
                backgroundImage: `repeating-linear-gradient(125deg, transparent, transparent 14px, rgba(255,255,255,0.02) 14px, rgba(255,255,255,0.02) 15px)`,
              }}
            />
          ) : isCTV ? (
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.5]"
              aria-hidden
              style={{
                background:
                  "linear-gradient(180deg, rgba(184,92,56,0.04) 0%, transparent 42%)",
              }}
            />
          ) : null}
          <div className="relative h-px w-full bg-gradient-to-r from-transparent via-[color:var(--book-accent)]/55 to-transparent" />

          <motion.div
            className="relative"
            variants={panelStagger}
            initial="hidden"
            animate="show"
          >
            <ServiceStep
              isCTV={isCTV}
              isLuxury={isLuxury}
              isLightPanel={isLightPanel}
              serviceOptions={serviceOptions}
              selectedServiceId={selectedService?.id ?? ""}
              selectedServiceLabel={
                selectedService ? serviceLabel(selectedService) : ""
              }
              serviceMeta={serviceMeta}
              onChange={setSelectedServiceId}
              panelItem={panelItem}
            />

            <DateTimeStep
              isCTV={isCTV}
              isLuxury={isLuxury}
              isLightPanel={isLightPanel}
              accent={accent}
              monthTitle={monthTitle}
              carouselPage={carouselPage}
              weekDates={weekDates}
              selectedDate={selectedDate}
              availableSlots={availableSlots}
              selectedTime={selectedTime}
              panelItem={panelItem}
              onPrevDates={handlePreviousDates}
              onNextDates={handleNextDates}
              onSelectDate={setSelectedDate}
              onSelectTime={setSelectedTime}
            />

            {/* Submit footer — kept inline to preserve panel stagger sequence (PR1). */}
            <motion.footer
              variants={panelItem}
              className={
                isLightPanel
                  ? "px-4 sm:px-5 py-5 bg-white"
                  : "px-4 sm:px-5 py-5 bg-black/[0.15]"
              }
            >
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="book-submit"
                className={
                  isLightPanel
                    ? "w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-45 disabled:cursor-not-allowed transition-[transform,box-shadow,filter] duration-200 ease-out hover:brightness-[1.05] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--book-accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    : "w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-45 disabled:cursor-not-allowed transition-[transform,box-shadow,filter] duration-200 ease-out hover:brightness-[1.06] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.5)]"
                }
                style={{
                  backgroundColor: accent,
                  boxShadow: isLuxury
                    ? "0 10px 28px -8px rgba(197, 160, 89, 0.45)"
                    : isCTV
                      ? "0 10px 28px -8px rgba(184, 92, 56, 0.55)"
                      : undefined,
                }}
              >
                {isSubmitting ? "Reservando…" : "Reservar ahora"}
              </button>
            </motion.footer>
          </motion.div>
        </motion.div>

        {showGuestFields ? (
          <CustomerConfirmStep
            isCTV={isCTV}
            isLuxury={isLuxury}
            isLightPanel={isLightPanel}
            inputClass={inputClass}
            lightInputClass={lightInputClass}
            customerName={customerName}
            customerPhone={customerPhone}
            customerEmail={customerEmail}
            notes={notes}
            customerMatches={customerMatches}
            linkedCustomerId={linkedCustomerId}
            errorMessage={errorMessage}
            successMessage={successMessage}
            onNameChange={(v) => {
              setCustomerName(v);
              setLinkedCustomerId(null);
            }}
            onPhoneChange={setCustomerPhone}
            onEmailChange={setCustomerEmail}
            onNotesChange={setNotes}
            onPickMatch={setLinkedCustomerId}
            formatPhoneDisplay={formatPhoneDisplay}
            phoneInputRef={(node) => {
              if (!node) return;
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
          />
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
