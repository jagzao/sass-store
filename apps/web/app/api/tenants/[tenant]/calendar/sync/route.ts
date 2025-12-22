import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { google } from "googleapis";
import { db } from "@sass-store/database";
import {
  tenants,
  bookings,
  customers,
  services,
} from "@sass-store/database/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Google Calendar Sync Endpoint
 *
 * Syncs events from Google Calendar to local bookings table.
 *
 * Features:
 * - Fetches events from the last 30 days by default
 * - Creates bookings for events that don't exist yet
 * - Automatically creates or links customers
 * - Skips events that are already synced (based on googleEventId)
 * - Handles token refresh automatically
 *
 * Query Parameters:
 * - daysBack: Number of days to look back (default: 30)
 * - autoConvertToVisits: Whether to auto-create visits for completed bookings (default: false)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get("daysBack") || "30");
    const autoConvertToVisits =
      searchParams.get("autoConvertToVisits") === "true";

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check if Google Calendar is connected
    if (!tenant.googleCalendarConnected || !tenant.googleCalendarTokens) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 400 },
      );
    }

    // Verify environment variables
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Google Calendar not configured" },
        { status: 500 },
      );
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials(tenant.googleCalendarTokens as any);

    // Handle token refresh if needed
    oauth2Client.on("tokens", async (tokens) => {
      if (tokens.refresh_token) {
        // Update tokens in database
        const updatedTokens = {
          ...(tenant.googleCalendarTokens as any),
          ...tokens,
        };
        await db
          .update(tenants)
          .set({ googleCalendarTokens: updatedTokens as any })
          .where(eq(tenants.id, tenant.id));
      }
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Calculate time range
    const timeMin = new Date(
      Date.now() - daysBack * 24 * 60 * 60 * 1000,
    ).toISOString();
    const timeMax = new Date().toISOString();

    // Fetch events from Google Calendar
    const eventsResponse = await calendar.events.list({
      calendarId: tenant.googleCalendarId || "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250, // Limit to avoid overwhelming the system
    });

    const events = eventsResponse.data.items || [];

    // Get all services for this tenant (for default mapping)
    const allServices = await db
      .select()
      .from(services)
      .where(eq(services.tenantId, tenant.id));

    const defaultService = allServices[0]; // Use first service as default

    if (!defaultService) {
      return NextResponse.json(
        {
          error:
            "No services found. Please create at least one service before syncing calendar.",
        },
        { status: 400 },
      );
    }

    // Process events and create bookings
    const syncedBookings = [];
    const skippedEvents = [];
    const errors = [];

    for (const event of events) {
      try {
        // Skip all-day events or events without proper time data
        if (!event.start?.dateTime || !event.end?.dateTime) {
          skippedEvents.push({
            id: event.id,
            reason: "All-day event or missing time data",
          });
          continue;
        }

        // Check if event already exists
        const existing = await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.googleEventId, event.id || ""),
              eq(bookings.tenantId, tenant.id),
            ),
          )
          .limit(1);

        if (existing.length > 0) {
          skippedEvents.push({ id: event.id, reason: "Already synced" });
          continue;
        }

        // Extract customer information
        const customerName = event.summary || "Sin nombre";
        const customerEmail =
          event.attendees?.[0]?.email || event.organizer?.email;
        const customerPhone = event.description?.match(/\+?[\d\s()-]{8,}/)?.[0]; // Try to extract phone from description

        const startTime = new Date(event.start.dateTime);
        const endTime = new Date(event.end.dateTime);

        // Try to find or create customer if email is available
        let customerId: string | null = null;
        if (customerEmail) {
          const [existingCustomer] = await db
            .select()
            .from(customers)
            .where(
              and(
                eq(customers.email, customerEmail),
                eq(customers.tenantId, tenant.id),
              ),
            )
            .limit(1);

          if (existingCustomer) {
            customerId = existingCustomer.id;
          } else {
            // Create new customer
            const [newCustomer] = await db
              .insert(customers)
              .values({
                tenantId: tenant.id,
                name: customerName,
                email: customerEmail,
                phone: customerPhone || "",
              })
              .returning();
            customerId = newCustomer.id;
          }
        }

        // Determine booking status based on event time
        let status: "pending" | "confirmed" | "completed" | "cancelled" =
          "pending";
        if (event.status === "cancelled") {
          status = "cancelled";
        } else if (endTime < new Date()) {
          status = "completed";
        } else if (event.status === "confirmed") {
          status = "confirmed";
        }

        // Create booking
        const [booking] = await db
          .insert(bookings)
          .values({
            tenantId: tenant.id,
            serviceId: defaultService.id, // Default to first service
            customerId,
            customerName,
            customerEmail: customerEmail || null,
            customerPhone: customerPhone || null,
            startTime,
            endTime,
            status,
            googleEventId: event.id || null,
            notes: event.description || null,
            totalPrice: defaultService.price, // Use service default price
            metadata: {
              syncedAt: new Date().toISOString(),
              originalEvent: {
                htmlLink: event.htmlLink,
                organizer: event.organizer?.email,
              },
            },
          })
          .returning();

        syncedBookings.push(booking);
      } catch (error) {
        errors.push({
          eventId: event.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalEvents: events.length,
        syncedBookings: syncedBookings.length,
        skippedEvents: skippedEvents.length,
        errors: errors.length,
      },
      syncedBookings,
      skippedEvents,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Calendar sync error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync calendar",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to check sync status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;

    const [tenant] = await db
      .select({
        id: tenants.id,
        googleCalendarConnected: tenants.googleCalendarConnected,
        googleCalendarId: tenants.googleCalendarId,
      })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Determine the calendar ID to display
    // If we have a stored ID, use it. If not, and we are connected, it defaults to 'primary'
    // but the UI might want to see 'primary' or the actual email if we had it.
    // For now we just return what we have.
    const calendarId =
      tenant.googleCalendarId ||
      (tenant.googleCalendarConnected ? "primary" : null);

    return NextResponse.json({
      connected: tenant.googleCalendarConnected || false,
      calendarId: calendarId,
      totalSyncedBookings: 0, // TODO: Implement count from DB if needed
    });
  } catch (error) {
    console.error("Get sync status error:", error);
    return NextResponse.json(
      {
        error: "Failed to get sync status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
