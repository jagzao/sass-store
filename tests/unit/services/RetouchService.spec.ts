import { describe, it, expect } from "vitest";
import { InMemoryRetouchService } from "@/lib/services/RetouchService";
import { expectSuccess, expectFailure } from "@sass-store/core/src/result";

describe("RetouchService - Result Pattern", () => {
  describe("calculateRetouchDate", () => {
    const baseDate = new Date("2025-06-15T10:00:00Z"); // Domingo

    it("should add days correctly", () => {
      const result = InMemoryRetouchService.calculateRetouchDate(
        baseDate,
        { frequencyType: "days", frequencyValue: 7, businessDaysOnly: false },
        [],
      );
      expect(result.toISOString().split("T")[0]).toBe("2025-06-22");
    });

    it("should add weeks correctly", () => {
      const result = InMemoryRetouchService.calculateRetouchDate(
        baseDate,
        { frequencyType: "weeks", frequencyValue: 2, businessDaysOnly: false },
        [],
      );
      expect(result.toISOString().split("T")[0]).toBe("2025-06-29");
    });

    it("should add months correctly", () => {
      const result = InMemoryRetouchService.calculateRetouchDate(
        baseDate,
        { frequencyType: "months", frequencyValue: 1, businessDaysOnly: false },
        [],
      );
      expect(result.toISOString().split("T")[0]).toBe("2025-07-15");
    });

    it("should skip weekend with businessDaysOnly true", () => {
      // Si baseDate es domingo y sumo 1 día → lunes OK sin feriado
      const base = new Date("2025-06-13T10:00:00Z"); // Viernes
      const result = InMemoryRetouchService.calculateRetouchDate(
        base,
        { frequencyType: "days", frequencyValue: 1, businessDaysOnly: true },
        [],
      );
      // Viernes + 1 = sábado → saltar a lunes
      expect(result.getDay()).toBe(1); // Monday
    });

    it("should skip holidays", () => {
      const holiday = new Date("2025-06-16T10:00:00Z");
      const result = InMemoryRetouchService.calculateRetouchDate(
        baseDate,
        { frequencyType: "days", frequencyValue: 1, businessDaysOnly: true },
        [holiday],
      );
      // 15 +1 = 16 (holiday) → saltar a 17
      expect(result.toISOString().split("T")[0]).toBe("2025-06-17");
    });

    it("should throw on unknown frequency type", () => {
      expect(() =>
        InMemoryRetouchService.calculateRetouchDate(
          baseDate,
          { frequencyType: "years" as any, frequencyValue: 1, businessDaysOnly: false },
          [],
        ),
      ).toThrow("Unknown frequency type");
    });
  });

  describe("validateConfig", () => {
    it("should pass with valid config", () => {
      const result = InMemoryRetouchService.validateConfig({
        frequencyType: "days",
        frequencyValue: 14,
        businessDaysOnly: true,
      });
      expect(result.success).toBe(true);
    });

    it("should fail for non-positive frequency", () => {
      const result = InMemoryRetouchService.validateConfig({
        frequencyType: "days",
        frequencyValue: 0,
        businessDaysOnly: false,
      });
      const error = expectFailure(result);
      expect(error.type).toBe("ValidationError");
    });

    it("should fail for invalid frequencyType", () => {
      const result = InMemoryRetouchService.validateConfig({
        frequencyType: "hours" as any,
        frequencyValue: 5,
        businessDaysOnly: false,
      });
      const error = expectFailure(result);
      expect(error.message).toContain("days, weeks, or months");
    });
  });

  describe("isOverdue", () => {
    it("should return true when past due date", () => {
      const past = new Date("2025-01-01T00:00:00Z");
      expect(InMemoryRetouchService.isOverdue(past, new Date("2025-06-01T00:00:00Z"))).toBe(true);
    });

    it("should return false when not yet due", () => {
      const future = new Date("2025-12-01T00:00:00Z");
      expect(InMemoryRetouchService.isOverdue(future, new Date("2025-06-01T00:00:00Z"))).toBe(false);
    });
  });
});
