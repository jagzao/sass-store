import { and, db, eq } from "@sass-store/database";
import { tenantConfigs } from "@sass-store/database/schema";
import { Err, Ok, Result, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

const INVENTORY_CONFIG_CATEGORY = "inventory";

export const getInventoryConfigArray = async <T>(
  tenantId: string,
  key: string,
): Promise<Result<T[], DomainError>> => {
  const result = await fromPromise(
    db
      .select({ value: tenantConfigs.value })
      .from(tenantConfigs)
      .where(
        and(
          eq(tenantConfigs.tenantId, tenantId),
          eq(tenantConfigs.category, INVENTORY_CONFIG_CATEGORY),
          eq(tenantConfigs.key, key),
        ),
      )
      .limit(1),
    (error) =>
      ErrorFactories.database(
        "get_inventory_config",
        `Failed to load inventory config ${key}`,
        undefined,
        error as Error,
      ),
  );

  if (!result.success) {
    return Err(result.error);
  }

  const value = result.data[0]?.value;
  if (!Array.isArray(value)) {
    return Ok([]);
  }

  return Ok(value as T[]);
};

export const setInventoryConfigArray = async <T>(
  tenantId: string,
  key: string,
  data: T[],
): Promise<Result<T[], DomainError>> => {
  const now = new Date();

  const result = await fromPromise(
    db
      .insert(tenantConfigs)
      .values({
        tenantId,
        category: INVENTORY_CONFIG_CATEGORY,
        key,
        value: data,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [tenantConfigs.tenantId, tenantConfigs.category, tenantConfigs.key],
        set: {
          value: data,
          updatedAt: now,
        },
      }),
    (error) =>
      ErrorFactories.database(
        "set_inventory_config",
        `Failed to persist inventory config ${key}`,
        undefined,
        error as Error,
      ),
  );

  if (!result.success) {
    return Err(result.error);
  }

  return Ok(data);
};

