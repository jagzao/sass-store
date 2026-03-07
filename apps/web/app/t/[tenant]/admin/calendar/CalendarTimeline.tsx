"use client";

import React, { useState, useMemo } from "react";
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
import { format, parse, addMinutes, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Check, X, Bell } from "lucide-react";
import { toast } from "sonner";

// Core Types
export interface TimelineBooking {
  id: string;
  serviceName: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number;
  status: string;
  phone: string;
  totalPrice: number;
  resourceId?: string; // e.g. "cabina-1"
}

interface CalendarTimelineProps {
  initialBookings: TimelineBooking[];
  currentDate: Date;
  tenantSlug: string;
  onBookingMoved?: (bookingId: string, newDate: string, newTime: string, newResourceId: string) => void;
}

const RESOURCES = [
  { id: "principal", name: "Área Principal" },
  { id: "cabina-1", name: "Cabina 1" },
  { id: "cabina-2", name: "Cabina 2" },
];

const TIME_START = 8; // 8:00 AM
const TIME_END = 20; // 8:00 PM
const INTERVAL = 30; // 30 mins

// --- Components ---

function DraggableAppointment({ booking }: { booking: TimelineBooking }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: booking.id,
    data: booking,
  });

  const durationIntervals = Math.max(1, Math.ceil(booking.duration / INTERVAL));
  const height = `calc(${durationIntervals * 100}% + ${(durationIntervals - 1) * 1}px)`;

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getAccentColor = (status: string) => {
    switch (status) {
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
      {...listeners}
      {...attributes}
      className={`absolute left-1 right-1 z-10 rounded-md border shadow-sm p-2 cursor-grab active:cursor-grabbing transition-opacity overflow-hidden ${getStatusColor(
        booking.status
      )} ${isDragging ? "opacity-50 ring-2 ring-[#C5A059] shadow-lg" : "opacity-100"}`}
      style={{
        height,
        top: 0,
      }}
    >
      {/* Accent left border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getAccentColor(booking.status)}`} />
      
      <div className="pl-1 h-full flex flex-col">
        <div className="flex items-center justify-between gap-1">
          <span className="font-semibold text-xs truncate">{booking.customerName}</span>
          <span className="text-[10px] font-medium text-gray-500 bg-white/50 px-1 rounded truncate">
            {booking.time}
          </span>
        </div>
        <span className="text-[10px] truncate text-gray-500">{booking.serviceName}</span>
      </div>
    </div>
  );
}

function TimeSlot({ id, time, resourceId, children }: { id: string; time: string; resourceId: string; children?: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { time, resourceId },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative h-[60px] border-b border-gray-100 transition-colors ${
        isOver ? "bg-indigo-50/50" : "hover:bg-gray-50/50"
      }`}
    >
      {children}
    </div>
  );
}

export default function CalendarTimeline({
  initialBookings,
  currentDate,
  tenantSlug,
  onBookingMoved,
}: CalendarTimelineProps) {
  const [bookings, setBookings] = useState<TimelineBooking[]>(() =>
    initialBookings.map((b) => ({ ...b, resourceId: b.resourceId || "principal" }))
  );
  const [activeDragBooking, setActiveDragBooking] = useState<TimelineBooking | null>(null);

  // Generate grid metrics
  const timeSlots: string[] = useMemo(() => {
    const slots = [];
    let current = new Date();
    current.setHours(TIME_START, 0, 0, 0);
    const end = new Date();
    end.setHours(TIME_END, 0, 0, 0);

    while (current <= end) {
      slots.push(format(current, "HH:mm"));
      current = addMinutes(current, INTERVAL);
    }
    return slots;
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    const activeBooking = bookings.find((b) => b.id === active.id);
    if (activeBooking) {
      setActiveDragBooking(activeBooking);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragBooking(null);
    const { active, over } = event;

    if (!over) return;

    const bookingId = active.id as string;
    const dropData = over.data.current as { time: string; resourceId: string };

    if (!dropData) return;

    const activeBooking = bookings.find((b) => b.id === bookingId);
    if (!activeBooking) return;

    // Check if the slot actually changed
    if (activeBooking.time === dropData.time && activeBooking.resourceId === dropData.resourceId) {
      return;
    }

    // Optimistically update UI
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, time: dropData.time, resourceId: dropData.resourceId }
          : b
      )
    );

    // Trigger WhatsApp notification & save
    toast.promise(
      // Mock API call for WhatsApp hook & save
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: "Moviendo cita y notificando por WhatsApp...",
        success: () => {
          onBookingMoved?.(bookingId, activeBooking.date, dropData.time, dropData.resourceId);
          return `Cita de ${activeBooking.customerName} movida a las ${dropData.time}`;
        },
        error: "Error al mover la cita",
      }
    );
  };

  const dateStr = format(currentDate, "yyyy-MM-dd");
  const dayBookings = bookings.filter((b) => b.date === dateStr);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-indigo-50/50 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white z-20">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-medium text-gray-900 capitalize-first">
            {format(currentDate, "EEEE, d 'de' MMMM", { locale: es })}
          </h2>
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              <span className="w-2 h-2 rounded-full bg-[#C5A059]" /> Pendiente
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Confirmada
            </span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto flex custom-scrollbar relative">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Time Axis (Left) */}
          <div className="w-20 flex-shrink-0 border-r border-gray-100 bg-gray-50/30 sticky left-0 z-20">
            <div className="h-12 border-b border-gray-100 bg-white sticky top-0 z-30 flex items-center justify-center">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Hora</span>
            </div>
            {timeSlots.map((time) => (
              <div key={`axis-${time}`} className="h-[60px] border-b border-gray-100 px-2 flex justify-end">
                <span className="text-xs font-medium text-gray-500 mt-2">{time}</span>
              </div>
            ))}
          </div>

          {/* Resources Columns */}
          {RESOURCES.map((resource) => (
            <div key={resource.id} className="flex-1 min-w-[250px] border-r border-gray-100 relative">
              {/* Resource Header */}
              <div className="h-12 border-b border-gray-100 bg-white sticky top-0 z-10 flex flex-col items-center justify-center">
                <span className="text-sm font-medium text-gray-900">{resource.name}</span>
              </div>

              {/* Time Slots for Resource */}
              <div className="relative">
                {timeSlots.map((time) => {
                  const slotId = `${resource.id}-${time}`;
                  const slotBookings = dayBookings.filter(
                    (b) => b.resourceId === resource.id && b.time === time
                  );

                  return (
                    <TimeSlot key={slotId} id={slotId} time={time} resourceId={resource.id}>
                      {slotBookings.map((booking) => (
                        <DraggableAppointment key={booking.id} booking={booking} />
                      ))}
                    </TimeSlot>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Drag Overlay */}
          <DragOverlay>
            {activeDragBooking ? (
              <div className="opacity-80 scale-105 shadow-xl ring-2 ring-[#C5A059] cursor-grabbing rounded-md p-2 bg-white border border-[#C5A059]/40 w-[240px]">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-xs truncate">{activeDragBooking.customerName}</span>
                  <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1 rounded">
                    {activeDragBooking.time}
                  </span>
                </div>
                <span className="text-[10px] truncate text-gray-500 w-full block">
                  {activeDragBooking.serviceName}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
