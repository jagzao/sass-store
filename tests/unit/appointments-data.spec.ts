/**
 * Tests for Appointments Data Service
 *
 * Tests the appointments data fetching and transformation
 * using Result Pattern for error handling.
 */

import { Result, Ok, Err, isSuccess, isFailure } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  getUnconfirmedAppointments,
  UnconfirmedAppointment,
  AppointmentsFilter,
} from "../../apps/web/lib/home/appointments-data";

// Mock fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Appointments Data Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUnconfirmedAppointments", () => {
    const tenantSlug = "test-tenant";
    const mockBookingResponse = {
      bookings: [
        {
          id: "booking-1",
          customerName: "María García",
          customer: { name: "María García", phone: "521234567890", email: "maria@example.com" },
          service: { name: "Manicure" },
          startTime: "2024-03-15T10:00:00Z",
          endTime: "2024-03-15T11:00:00Z",
          status: "pending",
          totalPrice: 350,
          notes: "Cliente regular",
        },
        {
          id: "booking-2",
          customer: { name: "Ana López", phone: "52987654321" },
          service: { name: "Pedicure" },
          startTime: "2024-03-16T14:00:00Z",
          endTime: "2024-03-16T15:30:00Z",
          status: "pending",
          totalPrice: 400,
        },
      ],
    };

    it("should return Ok with transformed appointments on successful fetch", async () => {
      // Setup mock response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBookingResponse,
      } as Response);

      const result = await getUnconfirmedAppointments(tenantSlug);

      // Should be a successful Result
      expect(isSuccess(result)).toBe(true);

      // Should contain transformed appointments
      if (isSuccess(result)) {
        const appointments = result.data;
        expect(appointments).toHaveLength(2);
        
        const firstAppointment = appointments[0];
        expect(firstAppointment.id).toBe("booking-1");
        expect(firstAppointment.customerName).toBe("María García");
        expect(firstAppointment.customerPhone).toBe("521234567890");
        expect(firstAppointment.customerEmail).toBe("maria@example.com");
        expect(firstAppointment.serviceName).toBe("Manicure");
        expect(firstAppointment.startTime).toBeInstanceOf(Date);
        expect(firstAppointment.endTime).toBeInstanceOf(Date);
        expect(firstAppointment.status).toBe("pending");
        expect(firstAppointment.totalPrice).toBe(350);
        expect(firstAppointment.notes).toBe("Cliente regular");

        const secondAppointment = appointments[1];
        expect(secondAppointment.id).toBe("booking-2");
        expect(secondAppointment.customerName).toBe("Ana López");
        expect(secondAppointment.customerPhone).toBe("52987654321");
        expect(secondAppointment.customerEmail).toBeUndefined();
        expect(secondAppointment.serviceName).toBe("Pedicure");
      }

      // Should have called fetch with correct parameters
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/tenants/${tenantSlug}/bookings?status=pending&limit=10`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    });

    it("should handle 404 error with NotFoundError", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      const result = await getUnconfirmedAppointments(tenantSlug);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe("NotFoundError");
      }
    });

    it("should handle other HTTP errors with DatabaseError", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      const result = await getUnconfirmedAppointments(tenantSlug);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe("DatabaseError");
        expect(result.error.message).toContain("Failed to fetch appointments");
      }
    });

    it("should handle network errors with DatabaseError", async () => {
      const networkError = new Error("Network failed");
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await getUnconfirmedAppointments(tenantSlug);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe("DatabaseError");
        expect(result.error.message).toContain("Failed to fetch appointments");
      }
    });

    it("should apply custom filter parameters", async () => {
      const filter: AppointmentsFilter = {
        status: "confirmed",
        limit: 5,
        fromDate: new Date("2024-03-01"),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ bookings: [] }),
      } as Response);

      await getUnconfirmedAppointments(tenantSlug, filter);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/tenants/${tenantSlug}/bookings`),
        expect.objectContaining({
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      // Verify the URL contains the correct query parameters
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain("status=confirmed");
      expect(callUrl).toContain("limit=5");
      expect(callUrl).toContain("from="); // fromDate should be included
    });

    it("should handle missing customer data gracefully", async () => {
      const responseWithMissingData = {
        bookings: [
          {
            id: "booking-3",
            // No customer object or customerName
            service: { name: "Manicure" },
            startTime: "2024-03-15T10:00:00Z",
            endTime: "2024-03-15T11:00:00Z",
            status: "pending",
            totalPrice: 350,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseWithMissingData,
      } as Response);

      const result = await getUnconfirmedAppointments(tenantSlug);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const appointment = result.data[0];
        expect(appointment.customerName).toBe("Cliente"); // Default fallback
        expect(appointment.customerPhone).toBeUndefined();
        expect(appointment.customerEmail).toBeUndefined();
      }
    });

    it("should handle missing service data gracefully", async () => {
      const responseWithMissingService = {
        bookings: [
          {
            id: "booking-4",
            customerName: "Test Customer",
            // No service object
            startTime: "2024-03-15T10:00:00Z",
            endTime: "2024-03-15T11:00:00Z",
            status: "pending",
            totalPrice: 350,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseWithMissingService,
      } as Response);

      const result = await getUnconfirmedAppointments(tenantSlug);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const appointment = result.data[0];
        expect(appointment.serviceName).toBe("Servicio"); // Default fallback
      }
    });

    it("should handle empty bookings array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ bookings: [] }),
      } as Response);

      const result = await getUnconfirmedAppointments(tenantSlug);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual([]);
      }
    });

    it("should handle missing bookings property in response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}), // No bookings property
      } as Response);

      const result = await getUnconfirmedAppointments(tenantSlug);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual([]);
      }
    });

    it("should convert totalPrice to number", async () => {
      const responseWithStringPrice = {
        bookings: [
          {
            id: "booking-5",
            customerName: "Test Customer",
            service: { name: "Manicure" },
            startTime: "2024-03-15T10:00:00Z",
            endTime: "2024-03-15T11:00:00Z",
            status: "pending",
            totalPrice: "350", // String instead of number
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseWithStringPrice,
      } as Response);

      const result = await getUnconfirmedAppointments(tenantSlug);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const appointment = result.data[0];
        expect(typeof appointment.totalPrice).toBe("number");
        expect(appointment.totalPrice).toBe(350);
      }
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety for UnconfirmedAppointment interface", () => {
      // This is a compile-time test, but we can at least verify the interface structure
      const mockAppointment: UnconfirmedAppointment = {
        id: "test-id",
        customerName: "Test Customer",
        customerPhone: "521234567890",
        customerEmail: "test@example.com",
        serviceName: "Test Service",
        startTime: new Date(),
        endTime: new Date(),
        status: "pending",
        totalPrice: 100,
        notes: "Test notes",
      };

      expect(mockAppointment.id).toBe("test-id");
      expect(mockAppointment.customerName).toBe("Test Customer");
      expect(mockAppointment.serviceName).toBe("Test Service");
      expect(mockAppointment.startTime).toBeInstanceOf(Date);
      expect(mockAppointment.endTime).toBeInstanceOf(Date);
      expect(mockAppointment.status).toBe("pending");
      expect(mockAppointment.totalPrice).toBe(100);
    });

    it("should maintain type safety for AppointmentsFilter interface", () => {
      const mockFilter: AppointmentsFilter = {
        status: "confirmed",
        limit: 20,
        fromDate: new Date(),
      };

      expect(mockFilter.status).toBe("confirmed");
      expect(mockFilter.limit).toBe(20);
      expect(mockFilter.fromDate).toBeInstanceOf(Date);
    });
  });
});