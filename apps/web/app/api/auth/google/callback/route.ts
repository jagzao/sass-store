import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

/**
 * Google Calendar OAuth 2.0 Callback Endpoint
 *
 * This endpoint handles the OAuth callback from Google after the user authorizes
 * the application to access their Google Calendar.
 *
 * Flow:
 * 1. User clicks "Connect Google Calendar" in admin panel
 * 2. User is redirected to Google's authorization page
 * 3. User grants permission
 * 4. Google redirects back to this endpoint with an authorization code
 * 5. We exchange the code for access and refresh tokens
 * 6. We store the tokens in the database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // Contains tenantId
    const error = searchParams.get("error");

    // Handle authorization errors
    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(
        new URL(
          `/t/${state}/settings/calendar?error=${encodeURIComponent(error)}`,
          request.url,
        ),
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing authorization code or state" },
        { status: 400 },
      );
    }

    // Verify environment variables
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Missing Google Calendar environment variables");
      return NextResponse.json(
        { error: "Google Calendar not configured" },
        { status: 500 },
      );
    }

    // Extract tenant slug from state
    const tenantSlug = state;

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Get calendar list to find the primary calendar ID
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    let calendarId = "primary";
    try {
      const calendarList = await calendar.calendarList.list();
      const primaryCalendar = calendarList.data.items?.find(
        (cal) => cal.primary,
      );
      if (primaryCalendar?.id) {
        calendarId = primaryCalendar.id;
      }
    } catch (err) {
      console.warn("Could not fetch calendar list, using 'primary':", err);
    }

    // Update tenant with tokens and calendar ID
    await db
      .update(tenants)
      .set({
        googleCalendarId: calendarId,
        googleCalendarTokens: tokens as any,
        googleCalendarConnected: true,
      })
      .where(eq(tenants.id, tenant.id));

    // Redirect back to calendar settings page with success message
    return NextResponse.redirect(
      new URL(`/t/${tenantSlug}/settings/calendar?success=true`, request.url),
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      {
        error: "Failed to connect Google Calendar",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
