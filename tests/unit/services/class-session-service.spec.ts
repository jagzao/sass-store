import { describe, it, expect } from "vitest";
import { computeSessionReminderSchedule } from "@/lib/notifications/session-reminder-notification";
import { isSportsTenant } from "@/lib/tenant/client-terminology";

describe("STRY-023 sports sessions", () => {
  describe("isSportsTenant", () => {
    it("detects centro-tenistico as sports", () => {
      expect(isSportsTenant("centro-tenistico")).toBe(true);
    });

    it("does not treat wondernails as sports", () => {
      expect(isSportsTenant("wondernails")).toBe(false);
    });
  });

  describe("computeSessionReminderSchedule", () => {
    it("schedules 24h and 1h reminders when start is far enough", () => {
      const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const schedule = computeSessionReminderSchedule(start);
      expect(schedule.reminder24h).not.toBeNull();
      expect(schedule.reminder1h).not.toBeNull();
    });

    it("skips 24h reminder when start is within 24h", () => {
      const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const schedule = computeSessionReminderSchedule(start);
      expect(schedule.reminder24h).toBeNull();
      expect(schedule.reminder1h).not.toBeNull();
    });
  });
});
