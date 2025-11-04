/**
 * Monitoring Middleware
 * Adds monitoring and metrics collection to API routes
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recordApiRequest,
  recordError,
  recordDatabaseQuery,
} from "@/lib/monitoring";
import { resolveTenant } from "@/lib/tenant-resolver";

export function withMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;

    let tenantId: string | undefined;

    try {
      // Try to resolve tenant for metrics
      const tenant = await resolveTenant(req);
      tenantId = tenant?.id;
    } catch (error) {
      // Tenant resolution might fail, continue without it
    }

    try {
      const response = await handler(req);
      const duration = Date.now() - startTime;

      // Record successful API request
      await recordApiRequest(method, path, response.status, duration, tenantId);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record error
      await recordError(error as Error, {
        method,
        path,
        tenantId,
        duration,
      });

      // Record failed API request
      await recordApiRequest(method, path, 500, duration, tenantId);

      throw error;
    }
  };
}

/**
 * Database query monitoring wrapper
 */
export async function withDatabaseMonitoring<T>(
  operation: string,
  table: string,
  tenantId: string | undefined,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    // Record successful database operation
    await recordDatabaseQuery(operation, table, duration, tenantId);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Record failed database operation
    await recordDatabaseQuery(`${operation}_error`, table, duration, tenantId);

    throw error;
  }
}
