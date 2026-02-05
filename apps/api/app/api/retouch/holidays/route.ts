import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tenantHolidays } from "@sass-store/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { Result, Ok, Err, ErrorFactories } from "@sass-store/core/src/result";
import { getCurrentTenant } from "@/lib/auth-utils";
import { withResultHandler } from "@/lib/middleware/result-handler";

/**
 * GET /api/retouch/holidays
 * Get all holidays for the current tenant
 */
export const GET = withResultHandler(
  async (request: NextRequest): Promise<any> => {
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      throw new Error("Unauthorized: No tenant found");
    }

    try {
      const holidays = await db
        .select()
        .from(tenantHolidays)
        .where(eq(tenantHolidays.tenantId, tenant.id))
        .orderBy(desc(tenantHolidays.date));

      return Ok(holidays);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_holidays",
          `Failed to get holidays for tenant ${tenant.id}`,
          undefined,
          error,
        ),
      );
    }
  },
);

/**
 * POST /api/retouch/holidays
 * Create a new holiday for the current tenant
 */
export const POST = withResultHandler(
  async (request: NextRequest): Promise<any> => {
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      throw new Error("Unauthorized: No tenant found");
    }

    try {
      const body = await request.json();
      const { name, date, isRecurring, affectsRetouch, notes } = body;

      // Validate required fields
      if (!name || !date) {
        throw new Error("Missing required fields: name, date");
      }

      // Check if holiday already exists for this date
      const existingHoliday = await db
        .select()
        .from(tenantHolidays)
        .where(
          and(
            eq(tenantHolidays.tenantId, tenant.id),
            eq(tenantHolidays.date, new Date(date)),
          ),
        )
        .limit(1);

      if (existingHoliday.length > 0) {
        return Err(
          ErrorFactories.validation(
            "holiday_exists",
            `A holiday already exists for date ${date}`,
          ),
        );
      }

      // Create the holiday
      const [newHoliday] = await db
        .insert(tenantHolidays)
        .values({
          tenantId: tenant.id,
          name,
          date: new Date(date),
          isRecurring: isRecurring || false,
          affectsRetouch: affectsRetouch !== false, // Default to true
          notes: notes || null,
        })
        .returning();

      return Ok(newHoliday);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "create_holiday",
          `Failed to create holiday for tenant ${tenant.id}`,
          undefined,
          error,
        ),
      );
    }
  },
);
