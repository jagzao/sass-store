import { NextRequest } from "next/server";
import { db } from "@sass-store/database";
import {
  bookings,
  services,
  customers,
  tenants,
} from "@sass-store/database/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

// Import Result pattern utilities
import { Result, Ok, Err, flatMap } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  withResultHandler,
  withQueryValidation,
} from "@sass-store/core/src/middleware/result-handler";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

// Validation schemas
const BookingQuerySchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: CommonSchemas.positiveInt.getSchema().optional(),
});

const BookingCreateSchema = z.object({
  serviceId: z.string().uuid("Service ID is required"),
  customerId: CommonSchemas.uuid.getSchema().optional(),
  staffId: CommonSchemas.uuid.getSchema().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: CommonSchemas.email.getSchema().optional(),
  customerPhone: z.string().optional(),
  startTime: z.string().datetime("Start time is required"),
  endTime: z.string().datetime("End time is required"),
  notes: z.string().optional(),
  totalPrice: z.number().positive("Total price must be positive"),
  status: z
    .enum(["pending", "confirmed", "completed", "cancelled"])
    .default("pending"),
});

// Types
interface BookingQuery {
  status?: "pending" | "confirmed" | "completed" | "cancelled";
  from?: string;
  to?: string;
  limit?: number;
}

interface BookingCreate {
  serviceId: string;
  customerId?: string;
  staffId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  startTime: string;
  endTime: string;
  notes?: string;
  totalPrice: number;
  status?: "pending" | "confirmed" | "completed" | "cancelled";
}

interface BookingResponse {
  id: string;
  serviceId: string;
  customerId?: string;
  staffId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  totalPrice: string;
  createdAt: string;
  updatedAt: string;
}

// Service layer functions with Result pattern

/**
 * Validate tenant exists
 */
const validateTenant = async (
  tenantSlug: string,
): Promise<Result<any, DomainError>> => {
  try {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return Err(ErrorFactories.notFound("Tenant", tenantSlug));
    }

    return Ok(tenant);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "validate_tenant",
        `Failed to validate tenant: ${tenantSlug}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Validate service exists and belongs to tenant
 */
const validateService = async (
  serviceId: string,
  tenantId: string,
): Promise<Result<any, DomainError>> => {
  try {
    const [service] = await db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.tenantId, tenantId)))
      .limit(1);

    if (!service) {
      return Err(ErrorFactories.notFound("Service", serviceId));
    }

    return Ok(service);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "validate_service",
        `Failed to validate service: ${serviceId}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Validate customer exists and belongs to tenant
 */
const validateCustomer = async (
  customerId: string,
  tenantId: string,
): Promise<Result<any, DomainError>> => {
  try {
    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
      )
      .limit(1);

    if (!customer) {
      return Err(ErrorFactories.notFound("Customer", customerId));
    }

    return Ok(customer);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "validate_customer",
        `Failed to validate customer: ${customerId}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Query bookings with filters
 */
const queryBookings = async (
  params: BookingQuery,
  tenantId: string,
): Promise<Result<BookingResponse[], DomainError>> => {
  try {
    const { limit = 100, status, from, to } = params;

    // Build query conditions
    const conditions = [
      eq(bookings.tenantId, tenantId),
      eq(bookings.active, true),
    ];

    if (status) {
      conditions.push(eq(bookings.status, status));
    }

    if (from) {
      conditions.push(gte(bookings.startTime, new Date(from)));
    }

    if (to) {
      conditions.push(lte(bookings.startTime, new Date(to)));
    }

    const [allBookings] = await db.query.bookings.findMany({
      where: and(...conditions),
      with: {
        service: true,
        customer: true,
        staff: true,
      },
      orderBy: [desc(bookings.startTime)],
      limit,
    });

    const bookingsData = allBookings.map(
      (booking): BookingResponse => ({
        id: booking.id,
        serviceId: booking.serviceId,
        customerId: booking.customerId,
        staffId: booking.staffId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        notes: booking.notes,
        totalPrice: booking.totalPrice?.toString() || "0",
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
      }),
    );

    return Ok(bookingsData);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "query_bookings",
        "Failed to query bookings",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Create a new booking
 */
const createBooking = async (
  bookingData: BookingCreate,
  tenantId: string,
): Promise<Result<BookingResponse, DomainError>> => {
  try {
    // Validate all dependencies
    const [tenant] = await validateTenant("default-tenant"); // TODO: Extract from auth
    if (!tenant.success) {
      return tenant;
    }

    const serviceResult = await validateService(
      bookingData.serviceId,
      tenant.id,
    );
    if (!serviceResult.success) {
      return serviceResult;
    }

    let customerResult = null;
    if (bookingData.customerId) {
      customerResult = await validateCustomer(
        bookingData.customerId,
        tenant.id,
      );
      if (!customerResult.success) {
        return customerResult;
      }
    }

    // Create booking
    const [newBooking] = await db
      .insert(bookings)
      .values({
        tenantId: tenant.id,
        serviceId: bookingData.serviceId,
        customerId: bookingData.customerId || null,
        staffId: bookingData.staffId || null,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail || null,
        customerPhone: bookingData.customerPhone || null,
        startTime: new Date(bookingData.startTime),
        endTime: new Date(bookingData.endTime),
        notes: bookingData.notes || null,
        totalPrice: bookingData.totalPrice.toString(),
        status: bookingData.status || "pending",
      })
      .returning();

    const bookingResponse: BookingResponse = {
      id: newBooking.id,
      serviceId: newBooking.serviceId,
      customerId: newBooking.customerId,
      staffId: newBooking.staffId,
      customerName: newBooking.customerName,
      customerEmail: newBooking.customerEmail,
      customerPhone: newBooking.customerPhone,
      startTime: newBooking.startTime.toISOString(),
      endTime: newBooking.endTime.toISOString(),
      status: newBooking.status,
      notes: newBooking.notes,
      totalPrice: newBooking.totalPrice.toString(),
      createdAt: newBooking.createdAt.toISOString(),
      updatedAt: newBooking.updatedAt.toISOString(),
    };

    return Ok(bookingResponse);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "create_booking",
        `Failed to create booking`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * GET /api/tenants/[tenant]/bookings - List bookings using Result Pattern
 */
export const GET = withQueryValidation(
  BookingQuerySchema,
  async (request: NextRequest, queryParams: BookingQuery) => {
    // TODO: Extract tenant slug from auth context
    const tenantSlug = "default-tenant"; // In real implementation, extract from auth

    const tenantResult = await validateTenant(tenantSlug);
    if (!tenantResult.success) {
      return tenantResult;
    }

    return await queryBookings(queryParams, tenantResult.data.id);
  },
);

/**
 * POST /api/tenants/[tenant]/bookings - Create booking using Result Pattern
 */
export const POST = withResultHandler(async (request: NextRequest) => {
  // TODO: Extract tenant slug from auth context
  const tenantSlug = "default-tenant"; // In real implementation, extract from auth

  const tenantResult = await validateTenant(tenantSlug);
  if (!tenantResult.success) {
    return tenantResult;
  }

  let bookingData: BookingCreate;
  try {
    bookingData = await request.json();
  } catch (error) {
    return Err(
      ErrorFactories.validation(
        "Invalid JSON in request body",
        undefined,
        undefined,
        error,
      ),
    );
  }

  const validation = validateWithZod(BookingCreateSchema, bookingData);
  if (!validation.success) {
    return validation;
  }

  return await createBooking(validation.data, tenantResult.data.id);
});
