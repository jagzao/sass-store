/**
 * Appointments Data Service
 *
 * Server-side data fetching for unconfirmed appointments.
 * Uses Result Pattern for error handling.
 */

import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

// Types for appointment data
export interface UnconfirmedAppointment {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  status: string;
  totalPrice: number;
  notes?: string;
}

export interface AppointmentsFilter {
  /** Filter by status (default: pending) */
  status?: "pending" | "confirmed" | "completed" | "cancelled";
  /** Maximum number of results */
  limit?: number;
  /** Include bookings from date */
  fromDate?: Date;
}

/**
 * Fetch unconfirmed appointments for a tenant
 *
 * This is a client-side fetch wrapper that calls the existing bookings API.
 * For server components, use the database directly.
 */
export async function getUnconfirmedAppointments(
  tenantSlug: string,
  filter: AppointmentsFilter = {}
): Promise<Result<UnconfirmedAppointment[], DomainError>> {
  const { status = "pending", limit = 10, fromDate } = filter;

  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.set("status", status);
    params.set("limit", String(limit));

    if (fromDate) {
      params.set("from", fromDate.toISOString());
    }

    // Fetch from existing bookings API
    const response = await fetch(
      `/api/tenants/${tenantSlug}/bookings?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return Err(ErrorFactories.notFound("Tenant", tenantSlug));
      }
      return Err(
        ErrorFactories.database(
          "get_appointments",
          `Failed to fetch appointments: ${response.statusText}`,
          undefined,
          new Error(`HTTP ${response.status}: ${response.statusText}`)
        )
      );
    }

    const data = await response.json();

    // Transform API response to our format
    const appointments: UnconfirmedAppointment[] = (data.bookings || []).map(
      (booking: any) => ({
        id: booking.id,
        customerName: booking.customerName || booking.customer?.name || "Cliente",
        customerPhone: booking.customerPhone || booking.customer?.phone,
        customerEmail: booking.customerEmail || booking.customer?.email,
        serviceName: booking.service?.name || "Servicio",
        startTime: new Date(booking.startTime),
        endTime: new Date(booking.endTime),
        status: booking.status,
        totalPrice: Number(booking.totalPrice) || 0,
        notes: booking.notes,
      })
    );

    return Ok(appointments);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "get_appointments",
        "Failed to fetch appointments",
        undefined,
        error instanceof Error ? error : new Error(String(error))
      )
    );
  }
}


export default getUnconfirmedAppointments;
