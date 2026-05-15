import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryBookingService,
  CreateBookingInput,
} from "@/lib/services/BookingService";
import { expectSuccess, expectFailure } from "@sass-store/core/src/result";

describe("BookingService - Result Pattern", () => {
  let service: InMemoryBookingService;

  beforeEach(() => {
    service = new InMemoryBookingService();
  });

  const validInput: CreateBookingInput = {
    serviceId: "svc-1",
    staffId: "staff-1",
    customerName: "Test Customer",
    customerEmail: "customer@test.com",
    customerPhone: "555-1234",
    startTime: new Date("2025-12-01T10:00:00Z"),
    endTime: new Date("2025-12-01T11:00:00Z"),
    notes: "First time",
    totalPrice: "50.00",
  };

  describe("createBooking", () => {
    it("should create a new booking with valid data", async () => {
      const result = await service.createBooking("tenant-1", validInput);
      const booking = expectSuccess(result);
      expect(booking.tenantId).toBe("tenant-1");
      expect(booking.serviceId).toBe("svc-1");
      expect(booking.customerName).toBe("Test Customer");
      expect(booking.status).toBe("confirmed");
    });

    it("should return validation error when customer name is empty", async () => {
      const result = await service.createBooking("tenant-1", {
        ...validInput,
        customerName: "",
      });
      const error = expectFailure(result);
      expect(error.type).toBe("ValidationError");
    });

    it("should return validation error when startTime >= endTime", async () => {
      const result = await service.createBooking("tenant-1", {
        ...validInput,
        startTime: new Date("2025-12-01T12:00:00Z"),
        endTime: new Date("2025-12-01T11:00:00Z"),
      });
      const error = expectFailure(result);
      expect(error.type).toBe("ValidationError");
      expect(error.message).toContain("must be before");
    });

    it("should link booking to registered customer when customerId provided", async () => {
      const result = await service.createBooking("tenant-1", {
        ...validInput,
        customerId: "cust-1",
      });
      const booking = expectSuccess(result);
      expect(booking.customerId).toBe("cust-1");
    });

    it("should create booking without optional customerEmail/Phone", async () => {
      const input: CreateBookingInput = {
        serviceId: "svc-1",
        staffId: "staff-1",
        customerName: "Jane Doe",
        startTime: new Date("2025-12-01T14:00:00Z"),
        endTime: new Date("2025-12-01T15:00:00Z"),
        totalPrice: "75.00",
      };
      const result = await service.createBooking("tenant-2", input);
      const booking = expectSuccess(result);
      expect(booking.tenantId).toBe("tenant-2");
      expect(booking.customerEmail).toBeUndefined();
    });
  });

  describe("updateStatus", () => {
    it("should update booking status from pending to confirmed", async () => {
      const createResult = await service.createBooking("tenant-1", validInput);
      const booking = expectSuccess(createResult);

      const updateResult = await service.updateStatus(booking.id, "cancelled");
      const updated = expectSuccess(updateResult);
      expect(updated.status).toBe("cancelled");
    });

    it("should return NotFoundError for non-existent booking", async () => {
      const result = await service.updateStatus("non-existent", "cancelled");
      const error = expectFailure(result);
      expect(error.type).toBe("NotFoundError");
    });
  });

  describe("tenant isolation", () => {
    it("should only return bookings for the requested tenant", async () => {
      await service.createBooking("tenant-a", validInput);
      await service.createBooking("tenant-a", validInput);
      await service.createBooking("tenant-b", validInput);

      const result = await service.getBookingsByTenant("tenant-a");
      const list = expectSuccess(result);
      expect(list).toHaveLength(2);
    });
  });

  describe("duration calculation", () => {
    it("should calculate correct duration in minutes", async () => {
      const result = await service.createBooking("tenant-1", validInput);
      const booking = expectSuccess(result);
      expect(service.getDurationMinutes(booking)).toBe(60);
    });
  });
});
