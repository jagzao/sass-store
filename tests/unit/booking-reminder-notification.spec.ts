import { describe, expect, it } from "vitest";
import { computeReminderSchedule } from "../../apps/web/lib/notifications/booking-reminder-notification";
import { interpolateTemplate } from "../../apps/web/lib/notifications/notification-template";

describe("booking reminder notifications", () => {
  it("schedules 24h and 1h before appointment when far enough in future", () => {
    const start = new Date("2026-06-01T15:00:00.000Z");
    const now = new Date("2026-05-30T12:00:00.000Z");
    const s = computeReminderSchedule(start, now);
    expect(s.reminder24h?.toISOString()).toBe("2026-05-31T15:00:00.000Z");
    expect(s.reminder1h?.toISOString()).toBe("2026-06-01T14:00:00.000Z");
  });

  it("skips 24h reminder when appointment is within 24 hours", () => {
    const start = new Date("2026-05-30T18:00:00.000Z");
    const now = new Date("2026-05-30T12:00:00.000Z");
    const s = computeReminderSchedule(start, now);
    expect(s.reminder24h).toBeNull();
    expect(s.reminder1h).not.toBeNull();
  });

  it("skips both when appointment is within 1 hour", () => {
    const start = new Date("2026-05-30T12:30:00.000Z");
    const now = new Date("2026-05-30T12:00:00.000Z");
    const s = computeReminderSchedule(start, now);
    expect(s.reminder24h).toBeNull();
    expect(s.reminder1h).toBeNull();
  });

  it("interpolates tenant template placeholders", () => {
    const body = interpolateTemplate(
      "Hola {{customerName}}, cita {{serviceName}} el {{appointmentDateTime}} en {{tenantName}}",
      {
        customerName: "Ana",
        serviceName: "Gel",
        appointmentDateTime: "lunes 10:00",
        tenantName: "Wonder Nails",
      },
    );
    expect(body).toContain("Ana");
    expect(body).toContain("Wonder Nails");
    expect(body).not.toContain("{{");
  });
});
