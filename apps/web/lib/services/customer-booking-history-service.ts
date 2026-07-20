import { db } from "@sass-store/database";
import { bookings, services, staff } from "@sass-store/database";
import { eq, and, desc } from "drizzle-orm";
import { Result, Ok, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export type CustomerBookingHistoryItem = {
  id: string;
  serviceName: string;
  staffName: string | null;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  notes: string | null;
};

export class CustomerBookingHistoryService {
  static async getBookingsForUser(
    tenantId: string,
    email: string,
  ): Promise<Result<CustomerBookingHistoryItem[], DomainError>> {
    return fromPromise(
      db
        .select({
          id: bookings.id,
          serviceName: services.name,
          staffName: staff.name,
          startTime: bookings.startTime,
          endTime: bookings.endTime,
          status: bookings.status,
          totalPrice: bookings.totalPrice,
          notes: bookings.notes,
        })
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .leftJoin(staff, eq(bookings.staffId, staff.id))
        .where(
          and(
            eq(bookings.tenantId, tenantId),
            eq(bookings.customerEmail, email),
          ),
        )
        .orderBy(desc(bookings.startTime))
        .limit(100),
      (error) =>
        ErrorFactories.database(
          "get_customer_booking_history",
          "Error al cargar historial de citas",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        ),
    ).then((result) =>
      result.success
        ? Ok(
            result.data.map((b) => ({
              id: b.id,
              serviceName: b.serviceName,
              staffName: b.staffName,
              startTime: b.startTime.toISOString(),
              endTime: b.endTime.toISOString(),
              status: b.status,
              totalPrice: Number(b.totalPrice),
              notes: b.notes,
            })),
          )
        : result,
    );
  }
}
