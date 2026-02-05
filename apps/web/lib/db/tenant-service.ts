import { db, withTenantContext } from "@sass-store/database";
import { tenants, services, products, staff } from "@sass-store/database";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getOrSetCache, CacheKeys } from "@/lib/cache/redis";
import type { Product, Service } from "@/types/tenant";

// Optimized in-memory cache for tenant data with LRU eviction
class TenantCache {
  private static cache = new Map<string, any>();
  private static TTL = 15 * 60 * 1000; // 15 minutes cache (increased from 5)
  private static timestamps = new Map<string, number>();
  private static accessCount = new Map<string, number>();
  private static readonly MAX_SIZE = 100; // Max cache entries

  static get(key: string) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.TTL) {
      this.delete(key);
      return null;
    }

    // Track access for LRU
    const count = this.accessCount.get(key) || 0;
    this.accessCount.set(key, count + 1);

    return this.cache.get(key);
  }

  static set(key: string, value: unknown) {
    // Evict LRU entries if cache is full
    if (this.cache.size >= this.MAX_SIZE) {
      this.evictLRU();
    }

    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    this.accessCount.set(key, 1);
  }

  static delete(key: string) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    this.accessCount.delete(key);
  }

  static clear() {
    this.cache.clear();
    this.timestamps.clear();
    this.accessCount.clear();
  }

  private static evictLRU() {
    let lruKey: string | null = null;
    let minAccess = Infinity;
    let oldestTime = Infinity;

    for (const [key, count] of this.accessCount.entries()) {
      const timestamp = this.timestamps.get(key) || 0;
      if (
        count < minAccess ||
        (count === minAccess && timestamp < oldestTime)
      ) {
        minAccess = count;
        oldestTime = timestamp;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
    }
  }
}

// Real database-driven tenant service
export class TenantService {
  // Get tenant by slug with complete data
  static async getTenantBySlug(slug: string) {
    try {
      console.log(`[TenantService] Fetching tenant from database: ${slug}`);

      // Query the actual database
      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);

      if (tenant && tenant.length > 0) {
        const tenantData = tenant[0];
        console.log(
          `[TenantService] Found tenant in database: ${tenantData.name}`,
        );

        return {
          id: tenantData.id,
          slug: tenantData.slug,
          name: tenantData.name,
          description: tenantData.description,
          mode: tenantData.mode,
          status: tenantData.status,
          branding: tenantData.branding,
          contact: tenantData.contact,
          location: tenantData.location,
          quotas: tenantData.quotas,
        };
      }
    } catch (error) {
      console.error("[TenantService] Database error:", error);
    }

    return null;
  }

  // Get tenant services (booking-mode tenants)
  static async getTenantServices(tenantId: string) {
    try {
      console.log(
        `[TenantService] Fetching services from database for tenant: ${tenantId}`,
      );

      // Query services from the database with RLS
      const tenantServices = await withTenantContext(
        db,
        tenantId,
        null,
        async (db) => {
          return await db
            .select()
            .from(services)
            .where(eq(services.tenantId, tenantId));
        },
      );

      if (Array.isArray(tenantServices)) {
        console.log(
          `[TenantService] Found ${tenantServices.length} services for tenant: ${tenantId}`,
        );

        return tenantServices.map((service: Service) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          featured: service.featured,
          active: service.active,
          description: service.description,
          shortDescription: service.shortDescription,
          longDescription: service.longDescription,
          metadata: {
            ...service.metadata,
            // Ensure image property exists in metadata if imageUrl is present
            image: service.metadata?.image || service.imageUrl,
          },
          imageUrl: service.imageUrl, // Also expose it directly
        }));
      }
    } catch (error) {
      console.error("Error fetching services from database:", error);
    }

    return [];
  }

  // Get tenant products (catalog-mode tenants)
  static async getTenantProducts(tenantId: string) {
    try {
      console.log(
        `[TenantService] Fetching products from database for tenant: ${tenantId}`,
      );

      // Query products from the database with RLS
      const tenantProducts = await withTenantContext(
        db,
        tenantId,
        null,
        async (db) => {
          return await db
            .select()
            .from(products)
            .where(eq(products.tenantId, tenantId));
        },
      );

      if (Array.isArray(tenantProducts)) {
        console.log(
          `[TenantService] Found ${tenantProducts.length} products for tenant: ${tenantId}`,
        );

        return tenantProducts.map((product: Product) => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          category: product.category,
          featured: product.featured,
          active: product.active,
          description: product.description,
          metadata: product.metadata,
        }));
      }
    } catch (error) {
      console.error("Error fetching products from database:", error);
    }

    return [];
  }

  // Get tenant staff (for booking tenants)
  static async getTenantStaff(tenantId: string) {
    try {
      console.log(
        `[TenantService] Fetching staff from database for tenant: ${tenantId}`,
      );

      // Query staff from the database with RLS
      const tenantStaff = await withTenantContext(
        db,
        tenantId,
        null,
        async (db) => {
          return await db
            .select()
            .from(staff)
            .where(eq(staff.tenantId, tenantId));
        },
      );

      if (Array.isArray(tenantStaff)) {
        console.log(
          `[TenantService] Found ${tenantStaff.length} staff members for tenant: ${tenantId}`,
        );

        return tenantStaff.map((staffMember: typeof staff.$inferSelect) => ({
          id: staffMember.id,
          name: staffMember.name,
          role: staffMember.role,
          email: staffMember.email,
          phone: staffMember.phone,
          specialties: staffMember.specialties,
          photo: staffMember.photo,
          active: staffMember.active,
          metadata: staffMember.metadata,
        }));
      }
    } catch (error) {
      console.error("Error fetching staff from database:", error);
    }

    return [];
  }

  // Get complete tenant data with all relations (optimized with Redis + in-memory cache)
  static async getTenantWithData(slug: string) {
    const memoryCacheKey = `tenant_with_data_${slug}`;
    const redisCacheKey = CacheKeys.tenantWithData(slug);

    // Check in-memory cache first (fastest)
    const memCached = TenantCache.get(memoryCacheKey);
    if (memCached) {
      console.log(`[TenantService] Using in-memory cache for: ${slug}`);
      return memCached;
    }

    // Use Redis cache-aside pattern with 10-minute TTL
    return await getOrSetCache(
      redisCacheKey,
      async () => {
        try {
          console.log(
            `[TenantService] Fetching complete tenant data for: ${slug}`,
          );

          // Single optimized query to get tenant with all relations in one go
          const tenant = await db
            .select()
            .from(tenants)
            .where(eq(tenants.slug, slug))
            .limit(1);

          if (!tenant || tenant.length === 0) {
            console.log(
              `[TenantService] Tenant not found in database: ${slug}`,
            );
            return null;
          }

          const tenantData = tenant[0];
          console.log(
            `[TenantService] Found tenant in database: ${tenantData.name}`,
          );

          // Parallel fetch of all related data with RLS context
          const [tenantServices, tenantProducts, tenantStaff] =
            await withTenantContext(db, tenantData.id, null, async (db) => {
              return await Promise.all([
                tenantData.mode === "booking"
                  ? db
                      .select()
                      .from(services)
                      .where(eq(services.tenantId, tenantData.id))
                  : Promise.resolve([]),
                db
                  .select()
                  .from(products)
                  .where(eq(products.tenantId, tenantData.id)),
                tenantData.mode === "booking"
                  ? db
                      .select()
                      .from(staff)
                      .where(eq(staff.tenantId, tenantData.id))
                  : Promise.resolve([]),
              ]);
            });

          console.log(
            `[TenantService] Loaded ${tenantServices.length} services, ${tenantProducts.length} products, ${tenantStaff.length} staff`,
          );

          const result = {
            id: tenantData.id,
            slug: tenantData.slug,
            name: tenantData.name,
            description: tenantData.description,
            mode: tenantData.mode,
            status: tenantData.status,
            branding: tenantData.branding,
            contact: tenantData.contact,
            location: tenantData.location,
            quotas: tenantData.quotas,
            services: tenantServices.map((service: Service) => ({
              id: service.id,
              name: service.name,
              price: service.price,
              duration: service.duration,
              featured: service.featured,
              active: service.active,
              description: service.description,
              shortDescription: service.shortDescription,
              longDescription: service.longDescription,
              metadata: {
                ...service.metadata,
                image: service.metadata?.image || service.imageUrl,
              },
              imageUrl: service.imageUrl,
            })),
            products: tenantProducts.map((product: Product) => ({
              id: product.id,
              sku: product.sku,
              name: product.name,
              price: product.price,
              category: product.category,
              featured: product.featured,
              active: product.active,
              description: product.description,
              metadata: product.metadata,
            })),
            staff: tenantStaff.map(
              (staffMember: typeof staff.$inferSelect) => ({
                id: staffMember.id,
                name: staffMember.name,
                role: staffMember.role,
                email: staffMember.email,
                phone: staffMember.phone,
                specialties: staffMember.specialties,
                photo: staffMember.photo,
                active: staffMember.active,
                metadata: staffMember.metadata,
              }),
            ),
          };

          // Also cache in memory for ultra-fast subsequent access
          TenantCache.set(memoryCacheKey, result);
          return result;
        } catch (error) {
          // Log and use fallback - this handles DB connection errors gracefully
          console.error(
            "[TenantService] Error fetching complete tenant data:",
            error,
          );
          return null;
        }
      },
      600, // 10 minutes TTL in Redis
    );
  }

  // Get featured services/products for homepage
  static async getFeaturedItems(tenantId: string, limit: number = 6) {
    try {
      const [featuredServices, featuredProducts] = await withTenantContext(
        db,
        tenantId,
        null,
        async (db) => {
          return await Promise.all([
            db
              .select()
              .from(services)
              .where(
                and(
                  eq(services.tenantId, tenantId),
                  eq(services.featured, true),
                  eq(services.active, true),
                ),
              )
              .limit(limit),
            db
              .select()
              .from(products)
              .where(
                and(
                  eq(products.tenantId, tenantId),
                  eq(products.featured, true),
                  eq(products.active, true),
                ),
              )
              .limit(limit),
          ]);
        },
      );

      return {
        services: featuredServices,
        products: featuredProducts,
      };
    } catch (error) {
      console.error("[TenantService] Error fetching featured items:", error);
      return {
        services: [],
        products: [],
      };
    }
  }
}

// Helper function for server components
export async function getTenantDataForPage(slug: string) {
  const tenantData = await TenantService.getTenantWithData(slug);

  if (!tenantData) {
    notFound();
  }

  return tenantData;
}

// Types for better TypeScript support
export type TenantWithData = NonNullable<
  Awaited<ReturnType<typeof TenantService.getTenantWithData>>
>;
export type FeaturedItems = Awaited<
  ReturnType<typeof TenantService.getFeaturedItems>
>;
