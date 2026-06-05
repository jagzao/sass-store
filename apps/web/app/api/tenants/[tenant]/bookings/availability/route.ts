/**
 * GET /api/tenants/[tenant]/bookings/availability
 *
 * Retorna los slots de tiempo disponibles para una fecha dada.
 * Usado por el bot de WhatsApp para responder consultas de disponibilidad.
 *
 * Query params:
 *   date  — YYYY-MM-DD (requerido)
 *   days  — número de días a consultar, máx 7 (opcional, default 1)
 *
 * Response:
 *   { slots: [{ date, time, available }], summary: "texto para WA" }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { tenants, bookings } from "@sass-store/database/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { getOperatingHours } from "@/lib/calendar/calendar-config-store";
import {
  buildTimeSlotsForDay,
  dayKeyFromDate,
  type OperatingHoursConfig,
} from "@/lib/calendar/operating-hours";

const DAY_ES: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

const MONTH_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");
    const daysParam = Math.min(
      parseInt(searchParams.get("days") ?? "1", 10),
      7,
    );

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { error: "Parámetro 'date' requerido en formato YYYY-MM-DD" },
        { status: 400 },
      );
    }

    // Resolver tenant
    const [tenant] = await db
      .select({ id: tenants.id, name: tenants.name })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 },
      );
    }

    // Cargar config de horarios
    const config: OperatingHoursConfig = await getOperatingHours(tenant.id);

    const allSlots: Array<{
      date: string;
      dayLabel: string;
      time: string;
      available: boolean;
    }> = [];

    const startDate = new Date(`${dateParam}T00:00:00`);

    for (let d = 0; d < daysParam; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);
      const dateIso = date.toISOString().slice(0, 10);

      // Slots del día según horario del tenant
      const daySlots = buildTimeSlotsForDay(config, date);
      if (daySlots.length === 0) continue; // día cerrado

      // Bookings existentes para ese día
      const dayStart = new Date(`${dateIso}T00:00:00`);
      const dayEnd = new Date(`${dateIso}T23:59:59`);

      const existingBookings = await db
        .select({ startTime: bookings.startTime, endTime: bookings.endTime })
        .from(bookings)
        .where(
          and(
            eq(bookings.tenantId, tenant.id),
            gte(bookings.startTime, dayStart),
            lt(bookings.startTime, dayEnd),
          ),
        );

      // Slots ocupados (por hora de inicio)
      const occupiedTimes = new Set(
        existingBookings.map((b) => {
          const t = new Date(b.startTime);
          return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
        }),
      );

      const dayLabel = `${DAY_ES[date.getDay()]} ${date.getDate()} de ${MONTH_ES[date.getMonth()]}`;

      for (const slot of daySlots) {
        if (!slot.isOpen) continue;
        allSlots.push({
          date: dateIso,
          dayLabel,
          time: slot.time,
          available: !occupiedTimes.has(slot.time),
        });
      }
    }

    const availableSlots = allSlots.filter((s) => s.available);
    const summary = buildWASummary(availableSlots, daysParam > 1);

    return NextResponse.json({
      slots: allSlots,
      availableCount: availableSlots.length,
      summary,
    });
  } catch (error) {
    console.error("[Availability API] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/** Formatea los slots disponibles como texto para enviar por WhatsApp */
function buildWASummary(
  slots: Array<{ date: string; dayLabel: string; time: string }>,
  multiDay: boolean,
): string {
  if (slots.length === 0) {
    return "Lo siento, no tenemos disponibilidad para esa fecha. ¿Te gustaría que revisara otro día?";
  }

  if (multiDay) {
    // Agrupar por día
    const byDay = new Map<string, string[]>();
    for (const s of slots) {
      const key = `${s.date}|${s.dayLabel}`;
      const list = byDay.get(key) ?? [];
      list.push(s.time);
      byDay.set(key, list);
    }

    const lines: string[] = ["Tenemos disponibilidad:"];
    for (const [key, times] of byDay) {
      const label = key.split("|")[1];
      lines.push(
        `📅 *${label}*: ${times.slice(0, 5).join(", ")}${times.length > 5 ? " …" : ""}`,
      );
    }
    lines.push("\n¿Qué día y hora te queda mejor?");
    return lines.join("\n");
  }

  // Un solo día
  const label = slots[0].dayLabel;
  const times = slots.slice(0, 8).map((s) => s.time);
  const more = slots.length > 8 ? ` y ${slots.length - 8} más` : "";
  return `Para el *${label}* tenemos disponibles: ${times.join(", ")}${more}. ¿Cuál te funciona?`;
}
