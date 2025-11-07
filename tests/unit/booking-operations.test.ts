import { describe, it, expect, beforeEach } from "vitest";
import {
  getTestDb,
  createTestTenant,
  createTestService,
  createTestUser,
} from "../setup/test-database";
import { bookings } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

describe("Booking Operations", () => {
  let testTenantId: string;
  let testServiceId: string;
  let testUserId: string;

  beforeEach(async () => {
    const tenant = await createTestTenant({
      slug: "test-salon",
      name: "Test Salon",
      mode: "booking",
    });
    testTenantId = tenant.id;

    const service = await createTestService(testTenantId, {
      name: "Haircut",
      price: "50.00",
      duration: 60,
    });
    testServiceId = service.id;

    const user = await createTestUser(testTenantId, {
      email: "customer@test.com",
      name: "Test Customer",
    });
    testUserId = user.id;
  });

  describe("Create Booking", () => {
    it("should create a new booking with valid data", async () => {
      const db = getTestDb();

      const startTime = new Date("2025-12-01T10:00:00Z");
      const endTime = new Date("2025-12-01T11:00:00Z");

      const [booking] = await db
        .insert(bookings)
        .values({
          tenantId: testTenantId,
          serviceId: testServiceId,
          userId: testUserId,
          startTime,
          endTime,
          status: "confirmed",
          notes: "First time customer",
        })
        .returning();

      expect(booking).toBeDefined();
      expect(booking.tenantId).toBe(testTenantId);
      expect(booking.serviceId).toBe(testServiceId);
      expect(booking.userId).toBe(testUserId);
      expect(booking.status).toBe("confirmed");
    });

    it("should enforce tenant isolation for bookings", async () => {
      const db = getTestDb();

      // Create another tenant
      const tenant2 = await createTestTenant({
        slug: "test-salon-2",
        name: "Test Salon 2",
        mode: "booking",
      });

      // Create booking for first tenant
      const [booking1] = await db
        .insert(bookings)
        .values({
          tenantId: testTenantId,
          serviceId: testServiceId,
          userId: testUserId,
          startTime: new Date("2025-12-01T10:00:00Z"),
          endTime: new Date("2025-12-01T11:00:00Z"),
          status: "confirmed",
        })
        .returning();

      // Query bookings for second tenant (should be empty)
      const tenant2Bookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.tenantId, tenant2.id));

      expect(tenant2Bookings).toHaveLength(0);

      // Query bookings for first tenant (should have 1)
      const tenant1Bookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.tenantId, testTenantId));

      expect(tenant1Bookings).toHaveLength(1);
    });
  });

  describe("Booking Status", () => {
    it("should update booking status", async () => {
      const db = getTestDb();

      const [booking] = await db
        .insert(bookings)
        .values({
          tenantId: testTenantId,
          serviceId: testServiceId,
          userId: testUserId,
          startTime: new Date("2025-12-01T10:00:00Z"),
          endTime: new Date("2025-12-01T11:00:00Z"),
          status: "pending",
        })
        .returning();

      // Update status to confirmed
      const [updated] = await db
        .update(bookings)
        .set({ status: "confirmed" })
        .where(eq(bookings.id, booking.id))
        .returning();

      expect(updated.status).toBe("confirmed");
    });

    it("should allow cancellation of bookings", async () => {
      const db = getTestDb();

      const [booking] = await db
        .insert(bookings)
        .values({
          tenantId: testTenantId,
          serviceId: testServiceId,
          userId: testUserId,
          startTime: new Date("2025-12-01T10:00:00Z"),
          endTime: new Date("2025-12-01T11:00:00Z"),
          status: "confirmed",
        })
        .returning();

      // Cancel booking
      const [cancelled] = await db
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, booking.id))
        .returning();

      expect(cancelled.status).toBe("cancelled");
    });
  });

  describe("Booking Time Validation", () => {
    it("should calculate correct duration", async () => {
      const db = getTestDb();

      const startTime = new Date("2025-12-01T10:00:00Z");
      const endTime = new Date("2025-12-01T11:00:00Z");

      const [booking] = await db
        .insert(bookings)
        .values({
          tenantId: testTenantId,
          serviceId: testServiceId,
          userId: testUserId,
          startTime,
          endTime,
          status: "confirmed",
        })
        .returning();

      const duration =
        (new Date(booking.endTime).getTime() -
          new Date(booking.startTime).getTime()) /
        (1000 * 60);
      expect(duration).toBe(60); // 60 minutes
    });
  });

  describe("Recurring Bookings", () => {
    it("should identify recurring bookings", async () => {
      const db = getTestDb();

      const [booking] = await db
        .insert(bookings)
        .values({
          tenantId: testTenantId,
          serviceId: testServiceId,
          userId: testUserId,
          startTime: new Date("2025-12-01T10:00:00Z"),
          endTime: new Date("2025-12-01T11:00:00Z"),
          status: "confirmed",
          isRecurring: true,
        })
        .returning();

      expect(booking.isRecurring).toBe(true);
    });
  });
});
