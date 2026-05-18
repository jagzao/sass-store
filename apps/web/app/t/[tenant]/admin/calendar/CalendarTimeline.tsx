"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { format, addMinutes, startOfWeek, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  GripVertical,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  buildTimeSlotsForDay,
  type OperatingHoursConfig,
} from "@/lib/calendar/operating-hours";
import { BookingDetailModal } from "./BookingDetailModal";

export interface TimelineBooking {
  id: string;
  serviceName: string;
  customerName: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  phone: string;
  totalPrice: number;
  customerId?: string | null;
  customerEmail?: string | null;
  startTimeIso?: string;
  resourceId?: string;
}

interface CalendarTimelineProps {
  initialBookings: TimelineBooking[];
  currentDate: Date;
  tenantSlug: string;
  tenantName: string;
  operatingHours: OperatingHoursConfig;
}

/* ─── viewport hook ─── */
function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

/* ─── visible days helper ─── */
function getVisibleDays(viewDate: Date, isDesktop: boolean): Date[] {
  if (isDesktop) {
    const mon = startOfWeek(viewDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }
  return [addDays(viewDate, -1), viewDate, addDays(viewDate, 1)];
}

/* ─── DraggableAppointment component ─── */
function DraggableAppointment({
  booking,
  intervalMinutes,
  onOpenDetail,
}: {
  booking: TimelineBooking;
  intervalMinutes: number;
  onOpenDetail: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: booking.id,
    data: booking,
  });

  const durationIntervals = Math.max(
    1,
    Math.ceil(booking.duration / intervalMinutes),
  );
  const height = `calc(${durationIntervals * 100}% + ${(durationIntervals - 1) * 1}px)`;

  const getStatusColor = (s: string) => {
    switch (s) {
      case "confirmed":
        return "bg-green-50 border-green-200 text-green-800";
      case "pending":
        return "bg-white border-[#C5A059]/40 text-gray-800";
      case "cancelled":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getAccentColor = (s: string) => {
    switch (s) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-[#C5A059]";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-1 right-1 z-10 rounded-md border shadow-sm transition-opacity overflow-hidden flex ${getStatusColor(
        booking.status,
      )} ${isDragging ? "opacity-50 ring-2 ring-[#C5A059] shadow-lg" : "opacity-100"}`}
      style={{ height, top: 0 }}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${getAccentColor(booking.status)}`}
      />
      <button
        type="button"
        className="shrink-0 px-0.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
        {...listeners}
        {...attributes}
        aria-label="Arrastrar cita"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        className="flex-1 min-w-0 pl-1 pr-2 py-2 text-left"
        onClick={() => onOpenDetail(booking.id)}
        data-testid={`booking-card-${booking.id}`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-semibold text-xs truncate">
            {booking.customerName}
          </span>
          <span className="text-[10px] font-medium text-gray-500 bg-white/50 px-1 rounded shrink-0">
            {booking.time}
          </span>
        </div>
        <span className="text-[10px] truncate text-gray-500 block">
          {booking.serviceName}
        </span>
      </button>
    </div>
  );
}

/* ─── Droppable TimeSlot component ─── */
function TimeSlotRow({
  id,
  time,
  resourceId,
  isOpen,
  children,
}: {
  id: string;
  time: string;
  resourceId: string;
  isOpen: boolean;
  children?: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { time, resourceId, isOpen },
    disabled: !isOpen,
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative h-[60px] border-b border-gray-100 transition-colors ${
        !isOpen
          ? "bg-gray-100/80"
          : isOver
            ? "bg-[#C5A059]/10"
            : "hover:bg-gray-50/50"
      }`}
    >
      {children}
    </div>
  );
}

/* ─── DayColumn component ─── */
function DayColumn({
  dayDate,
  dayLabel,
  daySubLabel,
  isToday,
  bookingsForDay,
  intervalMinutes,
  timeSlots,
  onOpenDetail,
}: {
  dayDate: Date;
  dayLabel: string;
  daySubLabel: string;
  isToday: boolean;
  bookingsForDay: TimelineBooking[];
  intervalMinutes: number;
  timeSlots: { time: string; isOpen: boolean }[];
  onOpenDetail: (id: string) => void;
}) {
  const dateStr = format(dayDate, "yyyy-MM-dd");

  return (
    <div className="flex-1 min-w-[200px] border-r border-gray-100 relative flex flex-col">
      {/* column header */}
      <div
        className={`h-12 border-b border-gray-100 sticky top-0 z-10 flex flex-col items-center justify-center ${
          isToday ? "bg-[#C5A059]/10" : "bg-white"
        }`}
      >
        <span className="text-xs font-bold text-gray-900 capitalize">
          {dayLabel}
        </span>
        <span
          className={`text-[10px] font-medium ${isToday ? "text-[#C5A059]" : "text-gray-400"}`}
        >
          {daySubLabel}
        </span>
      </div>

      {/* time grid */}
      <div className="relative flex-1">
        {timeSlots.map(({ time, isOpen }) => {
          const slotId = `${dateStr}-principal-${time}`;
          const slotBookings = bookingsForDay.filter(
            (b) => b.resourceId === "principal" && b.time === time,
          );
          return (
            <TimeSlotRow
              key={slotId}
              id={slotId}
              time={time}
              resourceId="principal"
              isOpen={isOpen}
            >
              {slotBookings.map((booking) => (
                <DraggableAppointment
                  key={booking.id}
                  booking={booking}
                  intervalMinutes={intervalMinutes}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </TimeSlotRow>
          );
        })}
      </div>
    </div>
  );
}

/* ─── main component ─── */
export default function CalendarTimeline({
  initialBookings,
  currentDate,
  tenantSlug,
  tenantName,
  operatingHours,
}: CalendarTimelineProps) {
  const [bookings, setBookings] = useState<TimelineBooking[]>(() =>
    initialBookings.map((b) => ({
      ...b,
      resourceId: b.resourceId || "principal",
    })),
  );
  const [viewDate, setViewDate] = useState<Date>(currentDate);
  const [activeDragBooking, setActiveDragBooking] =
    useState<TimelineBooking | null>(null);
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);
  const [ConfirmUI, confirm] = useConfirm();

  const viewportWidth = useViewportWidth();
  const isDesktop = viewportWidth >= 1024;

  const visibleDays = useMemo(
    () => getVisibleDays(viewDate, isDesktop),
    [viewDate, isDesktop],
  );

  const intervalMinutes = operatingHours.intervalMinutes;

  /* time slots derived from the first visible day (same hours every day) */
  const timeSlots = useMemo(
    () => buildTimeSlotsForDay(operatingHours, visibleDays[0]),
    [operatingHours, visibleDays],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  /* navigation callbacks */
  const goPrev = useCallback(
    () => setViewDate((d) => addDays(d, isDesktop ? -7 : -1)),
    [isDesktop],
  );
  const goNext = useCallback(
    () => setViewDate((d) => addDays(d, isDesktop ? 7 : 1)),
    [isDesktop],
  );
  const goToday = useCallback(() => setViewDate(new Date()), []);

  /* date picker */
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setViewDate(new Date(e.target.value + "T00:00:00"));
    }
  };

  /* header label */
  const headerLabel = useMemo(() => {
    const first = visibleDays[0];
    const last = visibleDays[visibleDays.length - 1];
    if (isDesktop) {
      return `${format(first, "d MMM", { locale: es })} – ${format(last, "d MMM yyyy", { locale: es })}`;
    }
    return format(viewDate, "EEEE, d 'de' MMMM", { locale: es });
  }, [visibleDays, isDesktop, viewDate]);

  /* persist reschedule */
  const persistReschedule = async (
    booking: TimelineBooking,
    newTime: string,
    previousTime: string,
  ) => {
    const [h, m] = newTime.split(":").map(Number);
    const newStart = new Date(booking.date);
    newStart.setHours(h, m, 0, 0);
    const newEnd = addMinutes(newStart, booking.duration);

    const previousStart = booking.startTimeIso
      ? new Date(booking.startTimeIso)
      : (() => {
          const [ph, pm] = previousTime.split(":").map(Number);
          const d = new Date(booking.date);
          d.setHours(ph, pm, 0, 0);
          return d;
        })();

    const res = await fetch(
      `/api/tenants/${tenantSlug}/bookings/${booking.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "No se pudo guardar el cambio");
    }

    return res.json();
  };

  /* drag end */
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragBooking(null);
    const { active, over } = event;
    if (!over) return;

    const bookingId = active.id as string;
    const dropData = over.data.current as {
      time: string;
      resourceId: string;
      isOpen?: boolean;
    };
    if (!dropData?.isOpen) {
      toast.error("Ese horario está fuera de operación");
      return;
    }

    const activeBooking = bookings.find((b) => b.id === bookingId);
    if (!activeBooking) return;

    if (
      activeBooking.time === dropData.time &&
      activeBooking.resourceId === dropData.resourceId
    ) {
      return;
    }

    const previousTime = activeBooking.time;

    const ok = await confirm({
      title: "¿Guardar cambio de horario?",
      description: `Mover la cita de ${activeBooking.customerName} de las ${previousTime} a las ${dropData.time}. Se notificará al cliente por WhatsApp si tiene teléfono registrado.`,
      subjectName: activeBooking.customerName,
      confirmLabel: "Guardar y notificar",
      cancelLabel: "Cancelar",
      variant: "info",
    });

    if (!ok) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              time: dropData.time,
              resourceId: dropData.resourceId,
              startTimeIso: (() => {
                const [h, m] = dropData.time.split(":").map(Number);
                const d = new Date(b.date);
                d.setHours(h, m, 0, 0);
                return d.toISOString();
              })(),
            }
          : b,
      ),
    );

    try {
      const payload = await persistReschedule(
        activeBooking,
        dropData.time,
        previousTime,
      );
      const queued = payload?.scheduledNotification;
      if (queued) {
        toast.success(
          "Cita reprogramada. Notificación WhatsApp en cola para envío.",
        );
      } else if (
        activeBooking.phone &&
        activeBooking.phone !== "Sin teléfono"
      ) {
        toast.success("Cita reprogramada.");
      } else {
        toast.success(
          "Cita reprogramada. Sin teléfono: no se encoló notificación.",
        );
      }
    } catch (e) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, time: previousTime } : b,
        ),
      );
      toast.error(e instanceof Error ? e.message : "Error al mover la cita");
    }
  };

  const now = new Date();

  return (
    <>
      <ConfirmUI />
      <BookingDetailModal
        bookingId={detailBookingId}
        tenantSlug={tenantSlug}
        tenantName={tenantName}
        onClose={() => setDetailBookingId(null)}
        onUpdated={() => {
          window.location.reload();
        }}
      />

      <div className="bg-white rounded-xl shadow-sm border border-indigo-50/50 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white z-20 shrink-0">
          <div className="flex items-center gap-3">
            {/* prev */}
            <button
              type="button"
              onClick={goPrev}
              aria-label={isDesktop ? "Semana anterior" : "Día anterior"}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* current / date */}
            <h2 className="text-lg font-semibold text-gray-900 capitalize-first min-w-[180px] text-center">
              {headerLabel}
            </h2>

            {/* next */}
            <button
              type="button"
              onClick={goNext}
              aria-label={isDesktop ? "Semana siguiente" : "Día siguiente"}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* today button */}
            {!isSameDay(viewDate, now) && (
              <button
                type="button"
                onClick={goToday}
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-md bg-[#C5A059]/10 text-[#C5A059] text-sm font-medium hover:bg-[#C5A059]/20 transition-colors"
              >
                Hoy
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* date picker */}
            <div className="relative">
              <label
                htmlFor="calendar-date-picker"
                className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                title="Seleccionar fecha"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Ir a fecha</span>
              </label>
              <input
                id="calendar-date-picker"
                type="date"
                onChange={handleDateChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* status badges */}
            <div className="hidden md:flex gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                <span className="w-2 h-2 rounded-full bg-[#C5A059]" /> Pendiente
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                <span className="w-2 h-2 rounded-full bg-green-500" />{" "}
                Confirmada
              </span>
            </div>
          </div>
        </div>

        {/* ── Scrollable grid ── */}
        {timeSlots.length === 0 ? (
          <p className="p-8 text-center text-gray-500 text-sm">
            Cerrado este día según el horario de operación.
          </p>
        ) : (
          <div className="flex-1 overflow-auto flex custom-scrollbar relative">
            <DndContext
              sensors={sensors}
              onDragStart={(event) => {
                const b = bookings.find((x) => x.id === event.active.id);
                if (b) setActiveDragBooking(b);
              }}
              onDragEnd={handleDragEnd}
            >
              {/* sticky time axis */}
              <div className="w-16 sm:w-20 flex-shrink-0 border-r border-gray-100 bg-gray-50/30 sticky left-0 z-20">
                <div className="h-12 border-b border-gray-100 bg-white sticky top-0 z-30" />
                {timeSlots.map(({ time }) => (
                  <div
                    key={`axis-${time}`}
                    className="h-[60px] border-b border-gray-100 px-1 sm:px-2 flex justify-end"
                  >
                    <span className="text-[10px] sm:text-xs font-medium text-gray-500 mt-2">
                      {time}
                    </span>
                  </div>
                ))}
              </div>

              {/* day columns */}
              {visibleDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayBookings = bookings.filter((b) => b.date === dateStr);
                const label = format(day, "EEEE", { locale: es });
                const subLabel = format(day, "d MMM", { locale: es });
                const today = isSameDay(day, now);
                return (
                  <DayColumn
                    key={dateStr}
                    dayDate={day}
                    dayLabel={label}
                    daySubLabel={subLabel}
                    isToday={today}
                    bookingsForDay={dayBookings}
                    intervalMinutes={intervalMinutes}
                    timeSlots={timeSlots}
                    onOpenDetail={setDetailBookingId}
                  />
                );
              })}

              <DragOverlay>
                {activeDragBooking ? (
                  <div className="opacity-80 scale-105 shadow-xl ring-2 ring-[#C5A059] cursor-grabbing rounded-md p-2 bg-white border border-[#C5A059]/40 w-[240px]">
                    <span className="font-semibold text-xs">
                      {activeDragBooking.customerName}
                    </span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>
    </>
  );
}
