import { NextRequest } from "next/server";
import { db } from "@sass-store/database";
import { services, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";

// Import Result pattern utilities
import { Result, Ok, Err, flatMap } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

// Validation schemas
const ServiceUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  imageUrl: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().url().nullable().optional(),
  ),
  videoUrl: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().url().nullable().optional(),
  ),
  duration: z.number().positive().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

// Types
interface ServiceUpdate {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  videoUrl?: string;
  duration?: number;
  featured?: boolean;
  active?: boolean;
  metadata?: Record<string, any>;
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
 * Get service by ID with tenant validation
 */
const getServiceById = async (
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
        "get_service",
        `Failed to get service: ${serviceId}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Update service with validation
 */
const updateService = async (
  serviceId: string,
  updateData: ServiceUpdate,
  tenantId: string,
): Promise<Result<any, DomainError>> => {
  try {
    // Validate service exists
    const serviceResult = await getServiceById(serviceId, tenantId);
    if (!serviceResult.success) {
      return serviceResult;
    }

    // Update service
    const [updatedService] = await db
      .update(services)
      .set(updateData)
      .where(and(eq(services.id, serviceId), eq(services.tenantId, tenantId)))
      .returning();

    return Ok(updatedService);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "update_service",
        `Failed to update service: ${serviceId}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * PATCH /api/tenants/[tenant]/services/[id] - Update service using Result Pattern
 */
export const PATCH = withResultHandler(
  async (request: NextRequest, context: any) => {
    const { tenant, id: serviceId } = await context.params;

    // Validate tenant exists
    const tenantResult = await validateTenant(tenant);
    if (!tenantResult.success) {
      return tenantResult;
    }

    // Parse and validate request body
    let updateData: ServiceUpdate;
    try {
      updateData = await request.json();
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

    const validation = validateWithZod(ServiceUpdateSchema, updateData);
    if (!validation.success) {
      return validation;
    }

    return await updateService(
      serviceId,
      validation.data,
      tenantResult.data.id,
    );
  },
);
