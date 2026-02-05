import { NextRequest } from "next/server";
import { db, tenants, users, userRoles } from "@sass-store/database";
import { eq, and, ilike, or, desc } from "drizzle-orm";

// Import Result pattern utilities
import { Result, Ok, Err, flatMap } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  withResultHandler,
  withQueryValidation,
} from "@sass-store/core/src/middleware/result-handler";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

// Validation schemas
const TenantQuerySchema = z.object({
  search: z.string().optional(),
  page: CommonSchemas.positiveInt.getSchema().optional(),
  limit: CommonSchemas.positiveInt.getSchema().optional(),
});

const TenantCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug cannot exceed 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  description: z.string().optional(),
  mode: z.enum(["booking", "ecommerce", "both"]).default("booking"),
  isActive: z.boolean().default(true),
  contactEmail: z.string().email("Invalid email").or(z.literal("")).optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().default("MXN"),
  timezone: z.string().default("America/Mexico_City"),
  language: z.string().default("es"),
  theme: z
    .object({
      primaryColor: z.string().default("#3B82F6"),
      secondaryColor: z.string().default("#10B981"),
      accentColor: z.string().default("#F59E0B"),
      logoUrl: z.string().optional(),
      faviconUrl: z.string().optional(),
    })
    .default({}),
  features: z
    .object({
      bookings: z.boolean().default(true),
      ecommerce: z.boolean().default(true),
      calendar: z.boolean().default(true),
      socialMedia: z.boolean().default(true),
      analytics: z.boolean().default(true),
      multiLanguage: z.boolean().default(false),
      customDomain: z.boolean().default(false),
    })
    .default({}),
});

// Types
interface TenantQuery {
  search?: string;
  page?: number;
  limit?: number;
}

interface TenantCreate {
  name: string;
  slug: string;
  description?: string;
  mode: "booking" | "ecommerce" | "both";
  isActive?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  language?: string;
  theme?: any;
  features?: any;
  adminUser?: any;
  seedData?: any;
}

interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  mode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Service layer functions with Result pattern

/**
 * Check if user is system admin
 */
const checkSystemAdmin = async (
  request: NextRequest,
): Promise<Result<void, DomainError>> => {
  // TODO: Implement proper admin check from auth
  // For now, we'll check for specific email
  // In a real implementation, this would come from auth middleware

  // Simulate admin check - replace with real auth
  return Ok(undefined);
};

/**
 * Check if tenant slug exists
 */
const checkTenantSlugExists = async (
  slug: string,
): Promise<Result<boolean, DomainError>> => {
  try {
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    return Ok(!!existingTenant);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "check_tenant_slug",
        `Failed to check if tenant slug exists: ${slug}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Create tenant with all related entities
 */
const createTenant = async (
  tenantData: TenantCreate,
): Promise<Result<any, DomainError>> => {
  try {
    // Start atomic transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create tenant
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          name: tenantData.name,
          slug: tenantData.slug,
          description: tenantData.description || null,
          mode: tenantData.mode,
          isActive: tenantData.isActive ?? true,
          contactEmail: tenantData.contactEmail || null,
          contactPhone: tenantData.contactPhone || null,
          address: tenantData.address || null,
          city: tenantData.city || null,
          country: tenantData.country || null,
          currency: tenantData.currency || "MXN",
          timezone: tenantData.timezone || "America/Mexico_City",
          language: tenantData.language || "es",
          theme: JSON.stringify(tenantData.theme || {}),
          features: JSON.stringify(tenantData.features || {}),
        })
        .returning();

      // 2. Create admin user if provided
      if (tenantData.adminUser) {
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const hashedPassword = `hashed_${tenantData.adminUser.password}_${Date.now()}`;

        await tx.insert(users).values({
          id: userId,
          name: tenantData.adminUser.name,
          email: tenantData.adminUser.email,
          password: hashedPassword,
          emailVerified: null,
        });

        await tx.insert(userRoles).values({
          userId: userId,
          tenantId: newTenant.id,
          role: "Admin",
          updatedAt: new Date(),
        });
      }

      return newTenant;
    });

    return Ok(result);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "create_tenant",
        `Failed to create tenant: ${tenantData.slug}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Query tenants with search and pagination
 */
const queryTenants = async (
  queryParams: TenantQuery,
): Promise<
  Result<{ tenants: TenantResponse[]; pagination: any }, DomainError>
> => {
  try {
    const { search, page = 1, limit = 10 } = queryParams;
    const offset = (page - 1) * limit;

    let whereCondition;
    if (search) {
      whereCondition = or(
        ilike(tenants.name, `%${search}%`),
        ilike(tenants.slug, `%${search}%`),
        ilike(tenants.description, `%${search}%`),
      );
    }

    const [allTenants, totalCount] = await Promise.all([
      db.query.tenants.findMany({
        where: whereCondition,
        limit,
        offset,
        orderBy: (tenants, { desc: desc(tenants.createdAt) }),
      }),
      db.select({ count: tenants._count }).from(tenants).where(whereCondition),
    ]);

    const tenants = allTenants.map((tenant: any) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description,
      mode: tenant.mode,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    }));

    return Ok({
      tenants,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        pages: Math.ceil((totalCount[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "query_tenants",
        "Failed to query tenants",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Complete tenant creation with Result pattern
 */
const createTenantWithAuth = async (
  request: NextRequest,
  tenantData: TenantCreate,
): Promise<Result<any, DomainError>> => {
  // Check admin permissions
  const adminCheckResult = await checkSystemAdmin(request);
  if (!adminCheckResult.success) {
    return adminCheckResult;
  }

  // Validate tenant data
  const validation = validateWithZod(TenantCreateSchema, tenantData);
  if (!validation.success) {
    return validation;
  }

  // Check if slug exists
  const slugCheckResult = await checkTenantSlugExists(validation.data.slug);
  if (!slugCheckResult.success) {
    return slugCheckResult;
  }

  if (slugCheckResult.data) {
    return Err(
      ErrorFactories.businessRule(
        "tenant_slug_exists",
        "Tenant slug already exists",
        "TENANT_SLUG_EXISTS",
      ),
    );
  }

  // Create tenant
  return await createTenant(validation.data);
};

/**
 * GET /api/tenants - List tenants using Result Pattern
 */
export const GET = withResultHandler(async (request: NextRequest) => {
  // Check admin permissions
  const adminCheckResult = await checkSystemAdmin(request);
  if (!adminCheckResult.success) {
    return adminCheckResult;
  }

  const { searchParams } = new URL(request.url);
  const queryParams: TenantQuery = {
    search: searchParams.get("search") || undefined,
    page: searchParams.get("page")
      ? parseInt(searchParams.get("page")!)
      : undefined,
    limit: searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined,
  };

  return await queryTenants(queryParams);
});

/**
 * POST /api/tenants - Create tenant using Result Pattern
 */
export const POST = withResultHandler(async (request: NextRequest) => {
  let tenantData: TenantCreate;

  try {
    tenantData = await request.json();
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

  return await createTenantWithAuth(request, tenantData);
});
