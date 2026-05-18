import { and, db, eq } from "@sass-store/database";
import { tenantConfigs } from "@sass-store/database/schema";
import {
  defaultOperatingHours,
  type OperatingHoursConfig,
} from "./operating-hours";

const CALENDAR_CATEGORY = "calendar";
const OPERATING_HOURS_KEY = "operating_hours";

export async function getOperatingHours(
  tenantId: string,
): Promise<OperatingHoursConfig> {
  const [row] = await db
    .select({ value: tenantConfigs.value })
    .from(tenantConfigs)
    .where(
      and(
        eq(tenantConfigs.tenantId, tenantId),
        eq(tenantConfigs.category, CALENDAR_CATEGORY),
        eq(tenantConfigs.key, OPERATING_HOURS_KEY),
      ),
    )
    .limit(1);

  const value = row?.value as OperatingHoursConfig | undefined;
  if (!value?.days || typeof value.intervalMinutes !== "number") {
    return defaultOperatingHours();
  }
  return value;
}

export async function setOperatingHours(
  tenantId: string,
  config: OperatingHoursConfig,
): Promise<OperatingHoursConfig> {
  const now = new Date();
  await db
    .insert(tenantConfigs)
    .values({
      tenantId,
      category: CALENDAR_CATEGORY,
      key: OPERATING_HOURS_KEY,
      value: config,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        tenantConfigs.tenantId,
        tenantConfigs.category,
        tenantConfigs.key,
      ],
      set: {
        value: config,
        updatedAt: now,
      },
    });

  return config;
}
