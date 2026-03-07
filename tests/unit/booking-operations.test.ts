// Using globals instead of imports since globals: true in Vitest config
import {
  getTestDb,
  createTestTenant,
  createTestService,
} from "../setup/test-database";
import { bookings, customers, staff } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

describe("Booking Operations", () => {
  let testTenantId: string;
  let testServiceId: string;
  let testStaffId: string;

  beforeEach(async () => {
    const db = getTestDb();
    
    const tenant = await createTestTenant({
      slug: "test-salon",
      name: "Test Salon",
      mode: "booking",
    });
    testTenantId = tenant.id;

    const service = await createTestService(testTenantId, {
      name: "Haircut",
      price: "50.00",
      duration: "60",
    });
    testServiceId = service.id;

    // Create test staff directly
    const [staffMember] = await db
      .insert(staff)
      .values({
        tenantId: testTenantId,
        name: "Test Stylist",
        role: "Stylist",
      })
      .returning();
    testStaffId = staffMember.id;
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
          staffId: testStaffId,
          customerName: "Test Customer",
          customerEmail: "customer@test.com",
          customerPhone: "555-1234",
          startTime,
          endTime,
          status: "confirmed",
          notes: "First time customer",
          totalPrice: "50.00",
        })
        .returning();

      expect(booking).toBeDefined();
      expect(booking.tenantId).toBe(testTenantId);
      expect(booking.serviceId).toBe(testServiceId);
      expect(booking.customerName).toBe("Test Customer");
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
          staffId: testStaffId,
          customerName: "Test Customer",
          customerEmail: "customer@test.com",
          startTime: new Date("2025-12-01T10:00:00Z"),
          endTime: new Date("2025-12-01T11:00:00Z"),
          status: "confirmed",
          totalPrice: "50.00",
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
          staffId: testStaffId,
          customerName: "Test Customer",
          customerEmail: "customer@test.com",
          startTime: new Date("2025-12-01T10:00:00Z"),
          endTime: new Date("2025-12-01T11:00:00Z"),
          status: "pending",
          totalPrice: "50.00",
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
          staffId: testStaffId,
          customerName: "Test Customer",
          customerEmail: "customer@test.com",
          startTime: new Date("2025-12-01T10:00:00Z"),
          endTime: new Date("2025-12-01T11:00:00Z"),
          status: "confirmed",
          totalPrice: "50.00",
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
          staffId: testStaffId,
          customerName: "Test Customer",
          customerEmail: "customer@test.com",
          startTime,
          endTime,
          status: "confirmed",
          totalPrice: "50.00",
        })
        .returning();

      const duration =
        (new Date(booking.endTime).getTime() -
          new Date(booking.startTime).getTime()) /
        (1000 * 60);
      expect(duration).toBe(60); // 60 minutes
    });
  });

  describe("Customer Linking", () => {
    it("should optionally link booking to registered customer", async () => {
      const db = getTestDb();

      // Create a customer first
      const [customer] = await db
        .insert(customers)
        .values({
          tenantId: testTenantId,
          name: "Registered Customer",
          phone: "555-9999",
          email: "registered@test.com",
        })
        .returning();

      const [booking] = await db
        .insert(bookings)
        .values({
          tenantId: testTenantId,
          serviceId: testServiceId,
          staffId: testStaffId,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          startTime: new Date("2025-12-01T10:00:00Z"),
          endTime: new Date("2025-12-01T11:00:00Z"),
          status: "confirmed",
          totalPrice: "50.00",
        })
        .returning();

      expect(booking.customerId).toBe(customer.id);
      expect(booking.customerName).toBe("Registered Customer");
    });
  });
});
