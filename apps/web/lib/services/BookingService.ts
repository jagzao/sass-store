import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export interface Booking {
  id: string;
  tenantId: string;
  serviceId: string;
  staffId: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  startTime: Date;
  endTime: Date;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  totalPrice: string;
}

export interface CreateBookingInput {
  serviceId: string;
  staffId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
  totalPrice: string;
  customerId?: string;
}

export interface IBookingService {
  createBooking(
    tenantId: string,
    data: CreateBookingInput,
  ): Promise<Result<Booking, DomainError>>;
  updateStatus(
    bookingId: string,
    status: Booking["status"],
  ): Promise<Result<Booking, DomainError>>;
  getBookingsByTenant(
    tenantId: string,
  ): Promise<Result<Booking[], DomainError>>;
  getDurationMinutes(booking: Booking): number;
}

export class InMemoryBookingService implements IBookingService {
  private bookings: Map<string, Booking> = new Map();

  async createBooking(
    tenantId: string,
    data: CreateBookingInput,
  ): Promise<Result<Booking, DomainError>> {
    if (!data.customerName?.trim()) {
      return Err(
        ErrorFactories.validation("Customer name is required", "customerName"),
      );
    }

    if (data.startTime >= data.endTime) {
      return Err(
        ErrorFactories.validation(
          "Start time must be before end time",
          "startTime",
        ),
      );
    }

    const booking: Booking = {
      id: `bk-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tenantId,
      ...data,
      status: "confirmed",
    };

    this.bookings.set(booking.id, booking);
    return Ok(booking);
  }

  async updateStatus(
    bookingId: string,
    status: Booking["status"],
  ): Promise<Result<Booking, DomainError>> {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      return Err(ErrorFactories.notFound("Booking", bookingId));
    }

    const updated = { ...booking, status };
    this.bookings.set(bookingId, updated);
    return Ok(updated);
  }

  async getBookingsByTenant(
    tenantId: string,
  ): Promise<Result<Booking[], DomainError>> {
    const list = Array.from(this.bookings.values()).filter(
      (b) => b.tenantId === tenantId,
    );
    return Ok(list);
  }

  getDurationMinutes(booking: Booking): number {
    return (
      (new Date(booking.endTime).getTime() -
        new Date(booking.startTime).getTime()) /
      (1000 * 60)
    );
  }

  clear(): void {
    this.bookings.clear();
  }
}
