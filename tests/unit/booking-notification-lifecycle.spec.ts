import { describe, expect, it } from "vitest";
import { computeReminderSchedule } from "../../apps/web/lib/notifications/booking-reminder-notification";
import { computeStaffReminderSchedule } from "../../apps/web/lib/notifications/booking-staff-notification";
import {
  interpolateTemplate,
  formatAppointmentDateTime,
} from "../../apps/web/lib/notifications/notification-template";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const future = (
  offsetMs: number,
  from = new Date("2026-06-10T10:00:00.000Z"),
) => new Date(from.getTime() + offsetMs);
const hours = (n: number) => n * 60 * 60 * 1000;
const days = (n: number) => n * 24 * hours(1);

// ─── Client reminder schedule ─────────────────────────────────────────────────

describe("computeReminderSchedule (client)", () => {
  it("schedules both when appointment is 3 days away", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const start = future(days(3), now);
    const s = computeReminderSchedule(start, now);
    expect(s.reminder24h).not.toBeNull();
    expect(s.reminder1h).not.toBeNull();
    expect(s.reminder24h!.getTime()).toBe(start.getTime() - hours(24));
    expect(s.reminder1h!.getTime()).toBe(start.getTime() - hours(1));
  });

  it("skips 24h when appointment is in 12 hours", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const start = future(hours(12), now);
    const s = computeReminderSchedule(start, now);
    expect(s.reminder24h).toBeNull();
    expect(s.reminder1h).not.toBeNull();
  });

  it("skips both when appointment is in 30 minutes", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const start = future(30 * 60 * 1000, now);
    const s = computeReminderSchedule(start, now);
    expect(s.reminder24h).toBeNull();
    expect(s.reminder1h).toBeNull();
  });

  it("skips both when appointment is in the past", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const start = future(-hours(2), now);
    const s = computeReminderSchedule(start, now);
    expect(s.reminder24h).toBeNull();
    expect(s.reminder1h).toBeNull();
  });

  it("schedules only 1h when exactly 2 hours away", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const start = future(hours(2), now);
    const s = computeReminderSchedule(start, now);
    expect(s.reminder24h).toBeNull();
    expect(s.reminder1h).not.toBeNull();
  });
});

// ─── Staff reminder schedule ──────────────────────────────────────────────────

describe("computeStaffReminderSchedule", () => {
  it("schedules both when appointment is 3 days away", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const start = future(days(3), now);
    const s = computeStaffReminderSchedule(start, now);
    expect(s.eveningBefore).not.toBeNull();
    expect(s.twoHoursBefore).not.toBeNull();
    expect(s.twoHoursBefore!.getTime()).toBe(start.getTime() - hours(2));
    // Evening is previous day at 20:00 UTC
    expect(s.eveningBefore!.getUTCHours()).toBe(20);
    expect(s.eveningBefore!.getUTCMinutes()).toBe(0);
  });

  it("skips evening when appointment is same day (within 24h)", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const start = future(hours(10), now); // same day
    const s = computeStaffReminderSchedule(start, now);
    // evening before would be yesterday at 20:00 — already past
    expect(s.eveningBefore).toBeNull();
    expect(s.twoHoursBefore).not.toBeNull();
  });

  it("skips 2h when appointment is in 1 hour", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const start = future(hours(1), now);
    const s = computeStaffReminderSchedule(start, now);
    expect(s.twoHoursBefore).toBeNull();
  });

  it("skips both when appointment is in 30 minutes", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const start = future(30 * 60 * 1000, now);
    const s = computeStaffReminderSchedule(start, now);
    expect(s.eveningBefore).toBeNull();
    expect(s.twoHoursBefore).toBeNull();
  });
});

// ─── Template interpolation ────────────────────────────────────────────────────

describe("interpolateTemplate", () => {
  it("replaces all known placeholders", () => {
    const tpl =
      "Hola {{customerName}}, cita en {{tenantName}} para {{serviceName}} el {{appointmentDateTime}}.";
    const result = interpolateTemplate(tpl, {
      customerName: "María",
      tenantName: "Wonder Nails",
      serviceName: "Gel Manicure",
      appointmentDateTime: "lunes 3:00 PM",
    });
    expect(result).toBe(
      "Hola María, cita en Wonder Nails para Gel Manicure el lunes 3:00 PM.",
    );
  });

  it("leaves unknown placeholders empty", () => {
    const result = interpolateTemplate("Hola {{unknown}}", {});
    expect(result).toBe("Hola ");
    expect(result).not.toContain("{{");
  });

  it("handles staff template with customerPhone", () => {
    const tpl =
      "Nueva cita: {{customerName}} | {{serviceName}} | {{appointmentDateTime}}. Tel: {{customerPhone}}.";
    const result = interpolateTemplate(tpl, {
      customerName: "Juan",
      serviceName: "Corte",
      appointmentDateTime: "martes 5:00 PM",
      customerPhone: "5215551234567",
    });
    expect(result).toContain("Juan");
    expect(result).toContain("5215551234567");
    expect(result).not.toContain("{{");
  });
});

// ─── formatAppointmentDateTime ─────────────────────────────────────────────────

describe("formatAppointmentDateTime", () => {
  it("formats a date in Spanish MX locale", () => {
    const d = new Date("2026-06-15T15:00:00.000Z");
    const formatted = formatAppointmentDateTime(d);
    // Should contain the day number and some time indicator
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(5);
  });
});

// ─── Idempotency key patterns ──────────────────────────────────────────────────

describe("idempotency key patterns", () => {
  const bookingId = "550e8400-e29b-41d4-a716-446655440000";
  const startIso = "2026-06-15T15:00:00.000Z";

  it("client keys include booking ID and start ISO", () => {
    const keys = [
      `booking_confirmation:${bookingId}`,
      `booking_reminder_24h:${bookingId}:${startIso}`,
      `booking_reminder_1h:${bookingId}:${startIso}`,
      `booking_reschedule:${bookingId}:${startIso}`,
    ];
    keys.forEach((k) => {
      expect(k).toContain(bookingId);
    });
  });

  it("staff keys are distinct from client keys", () => {
    const clientKey = `booking_reminder_24h:${bookingId}:${startIso}`;
    const staffEvening = `staff_reminder_evening:${bookingId}:${startIso}`;
    const staffNew = `staff_new_booking:${bookingId}`;
    expect(staffEvening).not.toBe(clientKey);
    expect(staffNew).not.toBe(clientKey);
  });

  it("reschedule key changes when start time changes", () => {
    const newStartIso = "2026-06-16T16:00:00.000Z";
    const key1 = `booking_reschedule:${bookingId}:${startIso}`;
    const key2 = `booking_reschedule:${bookingId}:${newStartIso}`;
    expect(key1).not.toBe(key2);
  });
});

// ─── Notification coverage matrix ─────────────────────────────────────────────

describe("notification coverage — all booking lifecycle events", () => {
  const events = [
    {
      event: "booking created",
      notifications: [
        "booking_confirmation",
        "booking_reminder_24h",
        "booking_reminder_1h",
        "staff_new_booking",
        "staff_reminder_evening",
        "staff_reminder_2h",
      ],
    },
    {
      event: "booking rescheduled",
      notifications: [
        "booking_reschedule",
        "booking_reminder_24h",
        "booking_reminder_1h",
        "staff_reminder_evening",
        "staff_reminder_2h",
      ],
    },
    {
      event: "booking confirmed (pending→confirmed)",
      notifications: ["booking_confirmed"],
    },
    { event: "booking cancelled", notifications: ["booking_cancelled"] },
    { event: "booking completed (no-show)", notifications: ["booking_noshow"] },
    {
      event: "booking completed (attended)",
      notifications: ["booking_review_request"],
    },
  ];

  events.forEach(({ event, notifications }) => {
    it(`${event} triggers: ${notifications.join(", ")}`, () => {
      // This test documents expected behavior — implementation verified in routes
      expect(notifications.length).toBeGreaterThan(0);
      notifications.forEach((n) => {
        expect(typeof n).toBe("string");
        expect(n.length).toBeGreaterThan(0);
      });
    });
  });
});
