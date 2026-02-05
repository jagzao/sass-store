import { db, withTenantContext } from "@sass-store/database";
import { products, services, bookings } from "@sass-store/database";
import { eq, and, desc, sql } from "drizzle-orm";

// Home page data service - replaces mock data with real database queries
export class HomeService {
  // Get recent purchases for "Buy Again" section
  static async getRecentPurchases(tenantId: string, limit: number = 6) {
    try {
      // In a real app, this would query orders/purchases table
      // For now, we'll get featured products as "recent purchases"
      const recentPurchases = await withTenantContext(
        db,
        tenantId,
        async (db) => {
          return await db
            .select({
              id: products.id,
              name: products.name,
              price: products.price,
              image: sql<string>`COALESCE(${products.metadata}->>'image', '')`,
              tenant: sql<string>`${tenantId}`,
              tenantName: sql<string>`''`, // Will be filled from tenant context
              lastPurchased: products.updatedAt,
              sku: products.sku,
            })
            .from(products)
            .where(
              and(eq(products.tenantId, tenantId), eq(products.active, true)),
            )
            .orderBy(desc(products.updatedAt))
            .limit(limit);
        },
      );

      return recentPurchases.map((item) => ({
        ...item,
        lastPurchased: new Date().toISOString().split("T")[0], // Mock last purchased date
      }));
    } catch (error) {
      console.error("Error fetching recent purchases:", error);
      return [];
    }
  }

  // Get unfinished items for "Continue Shopping" section
  static async getUnfinishedItems(tenantId: string, limit: number = 3) {
    try {
      // In a real app, this would query cart/checkout sessions
      // For now, we'll simulate with some products
      const unfinishedItems = await withTenantContext(
        db,
        tenantId,
        async (db) => {
          return await db
            .select({
              id: products.id,
              name: products.name,
              price: products.price,
              image: sql<string>`COALESCE(${products.metadata}->>'image', '')`,
              tenant: sql<string>`${tenantId}`,
              tenantName: sql<string>`''`, // Will be filled from tenant context
              addedToCart: products.createdAt,
              progress: sql<string>`'cart'`, // Mock progress state
            })
            .from(products)
            .where(
              and(
                eq(products.tenantId, tenantId),
                eq(products.active, true),
                eq(products.featured, true),
              ),
            )
            .orderBy(desc(products.createdAt))
            .limit(limit);
        },
      );

      return unfinishedItems.map((item) => ({
        ...item,
        addedToCart: "2024-01-16 10:30", // Mock timestamp
        progress: "cart" as const,
      }));
    } catch (error) {
      console.error("Error fetching unfinished items:", error);
      return [];
    }
  }

  // Get recent bookings for "Book Again" section
  static async getRecentBookings(tenantId: string, limit: number = 3) {
    try {
      // Get services that could be booked again
      const recentBookings = await withTenantContext(
        db,
        tenantId,
        async (db) => {
          return await db
            .select({
              id: services.id,
              name: services.name,
              price: services.price,
              duration: services.duration,
              image: sql<string>`COALESCE(${services.metadata}->>'image', '')`,
              tenant: sql<string>`${tenantId}`,
              tenantName: sql<string>`''`, // Will be filled from tenant context
              preferredStaff: sql<string>`'Available Staff'`, // Mock staff
              nextAvailableSlot: sql<string>`'14:30'`, // Mock time slot
              lastBooked: services.updatedAt,
            })
            .from(services)
            .where(
              and(eq(services.tenantId, tenantId), eq(services.active, true)),
            )
            .orderBy(desc(services.updatedAt))
            .limit(limit);
        },
      );

      return recentBookings.map((item) => ({
        ...item,
        lastBooked: "2024-01-15", // Mock last booked date
        nextAvailableSlot: "14:30", // Mock available slot
        preferredStaff: "Available Staff",
      }));
    } catch (error) {
      console.error("Error fetching recent bookings:", error);
      return [];
    }
  }

  // Get trending items for "Trending" section
  static async getTrendingItems(tenantId: string, limit: number = 5) {
    try {
      // Get both products and services for trending with RLS
      const [trendingProducts, trendingServices] = await withTenantContext(
        db,
        tenantId,
        async (db) => {
          return await Promise.all([
            db
              .select({
                id: products.id,
                name: products.name,
                price: products.price,
                originalPrice: sql<string>`null`, // Could be calculated from metadata
                image: sql<string>`COALESCE(${products.metadata}->>'image', '')`,
                tenant: sql<string>`${tenantId}`,
                tenantName: sql<string>`''`, // Will be filled from tenant context
                category: products.category,
                type: sql<string>`'product'`,
                discount: sql<number>`null`,
                trending: sql<string>`'hot'`, // Mock trending status
                salesCount: sql<number>`cast(random() * 100 + 10 as int)`, // Mock sales count
              })
              .from(products)
              .where(
                and(
                  eq(products.tenantId, tenantId),
                  eq(products.active, true),
                  eq(products.featured, true),
                ),
              )
              .limit(Math.ceil(limit / 2)),

            db
              .select({
                id: services.id,
                name: services.name,
                price: services.price,
                originalPrice: sql<string>`null`,
                image: sql<string>`COALESCE(${services.metadata}->>'image', '')`,
                tenant: sql<string>`${tenantId}`,
                tenantName: sql<string>`''`, // Will be filled from tenant context
                category: sql<string>`COALESCE(${services.metadata}->>'category', '')`,
                type: sql<string>`'service'`,
                discount: sql<number>`null`,
                trending: sql<string>`'hot'`,
                salesCount: sql<number>`cast(random() * 50 + 5 as int)`,
              })
              .from(services)
              .where(
                and(
                  eq(services.tenantId, tenantId),
                  eq(services.active, true),
                  eq(services.featured, true),
                ),
              )
              .limit(Math.floor(limit / 2)),
          ]);
        },
      );

      // Combine and shuffle
      const allItems = [...trendingProducts, ...trendingServices];
      return allItems.slice(0, limit);
    } catch (error) {
      console.error("Error fetching trending items:", error);
      return [];
    }
  }

  // Get all home data in one call
  static async getHomeData(tenantId: string, tenantName: string) {
    try {
      const [recentPurchases, unfinishedItems, recentBookings, trendingItems] =
        await Promise.all([
          this.getRecentPurchases(tenantId),
          this.getUnfinishedItems(tenantId),
          this.getRecentBookings(tenantId),
          this.getTrendingItems(tenantId),
        ]);

      // Fill in tenant names
      const fillTenantName = (items: any[]) =>
        items.map((item) => ({ ...item, tenantName }));

      return {
        recentPurchases: fillTenantName(recentPurchases),
        unfinishedItems: fillTenantName(unfinishedItems),
        recentBookings: fillTenantName(recentBookings),
        trendingItems: fillTenantName(trendingItems),
      };
    } catch (error) {
      console.error("Error fetching home data:", error);
      return {
        recentPurchases: [],
        unfinishedItems: [],
        recentBookings: [],
        trendingItems: [],
      };
    }
  }
}

// Helper function to get tenant-specific home data
export async function getHomeDataForTenant(
  tenantId: string,
  tenantName: string,
) {
  return HomeService.getHomeData(tenantId, tenantName);
}

// Types for TypeScript support
export type HomeData = Awaited<ReturnType<typeof HomeService.getHomeData>>;
export type RecentPurchase = HomeData["recentPurchases"][0];
export type UnfinishedItem = HomeData["unfinishedItems"][0];
export type RecentBooking = HomeData["recentBookings"][0];
export type TrendingItem = HomeData["trendingItems"][0];
