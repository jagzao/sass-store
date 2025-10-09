import { db } from "@sass-store/database";
import {
  tenants,
  products,
  services,
  productReviews,
  bookings,
} from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { GraphQLError } from "graphql";

// Helper to get tenant by slug
async function getTenantBySlug(slug: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  if (!tenant) {
    throw new GraphQLError(`Tenant not found: ${slug}`, {
      extensions: { code: "TENANT_NOT_FOUND" },
    });
  }
  return tenant;
}

export const resolvers = {
  Query: {
    // Tenant queries
    tenant: async (_: any, { slug }: { slug: string }) => {
      return getTenantBySlug(slug);
    },

    tenants: async (_: any, { status }: { status?: string }) => {
      if (status) {
        return db.select().from(tenants).where(eq(tenants.status, status));
      }
      return db.select().from(tenants);
    },

    // Product queries
    product: async (_: any, { id }: { id: string }) => {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);
      if (!product) {
        throw new GraphQLError("Product not found", {
          extensions: { code: "PRODUCT_NOT_FOUND" },
        });
      }
      return product;
    },

    products: async (_: any, { tenantSlug, category, featured }: any) => {
      const tenant = await getTenantBySlug(tenantSlug);

      let conditions = [eq(products.tenantId, tenant.id)];

      if (category) {
        conditions.push(eq(products.category, category));
      }

      if (featured !== undefined) {
        conditions.push(eq(products.featured, featured));
      }

      return db
        .select()
        .from(products)
        .where(and(...conditions));
    },

    // Service queries
    service: async (_: any, { id }: { id: string }) => {
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);
      if (!service) {
        throw new GraphQLError("Service not found", {
          extensions: { code: "SERVICE_NOT_FOUND" },
        });
      }
      return service;
    },

    services: async (_: any, { tenantSlug, featured }: any) => {
      const tenant = await getTenantBySlug(tenantSlug);

      let conditions = [eq(services.tenantId, tenant.id)];

      if (featured !== undefined) {
        conditions.push(eq(services.featured, featured));
      }

      return db
        .select()
        .from(services)
        .where(and(...conditions));
    },

    // Review queries
    reviews: async (_: any, { productId, status }: any) => {
      let conditions = [eq(productReviews.productId, productId)];

      if (status) {
        conditions.push(eq(productReviews.status, status));
      }

      return db
        .select()
        .from(productReviews)
        .where(and(...conditions));
    },

    // Booking queries
    booking: async (_: any, { id }: { id: string }) => {
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, id))
        .limit(1);
      if (!booking) {
        throw new GraphQLError("Booking not found", {
          extensions: { code: "BOOKING_NOT_FOUND" },
        });
      }
      return booking;
    },

    bookings: async (_: any, { tenantSlug, status }: any) => {
      const tenant = await getTenantBySlug(tenantSlug);

      let conditions = [eq(bookings.tenantId, tenant.id)];

      if (status) {
        conditions.push(eq(bookings.status, status));
      }

      return db
        .select()
        .from(bookings)
        .where(and(...conditions));
    },
  },

  Mutation: {
    // Product mutations
    createProduct: async (_: any, { input }: any) => {
      const tenant = await getTenantBySlug(input.tenantSlug);

      const [product] = await db
        .insert(products)
        .values({
          tenantId: tenant.id,
          sku: input.sku,
          name: input.name,
          description: input.description,
          price: input.price.toString(),
          category: input.category,
          featured: input.featured ?? false,
          active: input.active ?? true,
          metadata: input.metadata,
        })
        .returning();

      return product;
    },

    updateProduct: async (_: any, { id, input }: any) => {
      const [product] = await db
        .update(products)
        .set({
          ...input,
          price: input.price ? input.price.toString() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();

      if (!product) {
        throw new GraphQLError("Product not found", {
          extensions: { code: "PRODUCT_NOT_FOUND" },
        });
      }

      return product;
    },

    deleteProduct: async (_: any, { id }: { id: string }) => {
      const result = await db.delete(products).where(eq(products.id, id));
      return true;
    },

    // Review mutations
    createReview: async (_: any, { input }: any) => {
      const tenant = await getTenantBySlug(input.tenantSlug);

      const [review] = await db
        .insert(productReviews)
        .values({
          productId: input.productId,
          tenantId: tenant.id,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          rating: input.rating,
          title: input.title,
          comment: input.comment,
          status: "pending",
          helpful: 0,
          reported: 0,
        })
        .returning();

      return review;
    },

    updateReview: async (_: any, { id, input }: any) => {
      const [review] = await db
        .update(productReviews)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(productReviews.id, id))
        .returning();

      if (!review) {
        throw new GraphQLError("Review not found", {
          extensions: { code: "REVIEW_NOT_FOUND" },
        });
      }

      return review;
    },

    deleteReview: async (_: any, { id }: { id: string }) => {
      await db.delete(productReviews).where(eq(productReviews.id, id));
      return true;
    },

    // Booking mutations
    createBooking: async (_: any, { input }: any) => {
      const tenant = await getTenantBySlug(input.tenantSlug);

      const [booking] = await db
        .insert(bookings)
        .values({
          serviceId: input.serviceId,
          tenantId: tenant.id,
          staffId: input.staffId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          status: "pending",
          notes: input.notes,
          totalPrice: input.totalPrice || "0.00",
        })
        .returning();

      return booking;
    },

    updateBooking: async (_: any, { id, input }: any) => {
      const updateData: any = {
        ...input,
        updatedAt: new Date(),
      };

      if (input.startTime) updateData.startTime = new Date(input.startTime);
      if (input.endTime) updateData.endTime = new Date(input.endTime);

      const [booking] = await db
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.id, id))
        .returning();

      if (!booking) {
        throw new GraphQLError("Booking not found", {
          extensions: { code: "BOOKING_NOT_FOUND" },
        });
      }

      return booking;
    },

    cancelBooking: async (_: any, { id }: { id: string }) => {
      const [booking] = await db
        .update(bookings)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(bookings.id, id))
        .returning();

      if (!booking) {
        throw new GraphQLError("Booking not found", {
          extensions: { code: "BOOKING_NOT_FOUND" },
        });
      }

      return booking;
    },
  },

  // Field resolvers
  Tenant: {
    products: async (parent: any) => {
      return db.select().from(products).where(eq(products.tenantId, parent.id));
    },
    services: async (parent: any) => {
      return db.select().from(services).where(eq(services.tenantId, parent.id));
    },
  },

  Product: {
    tenant: async (parent: any) => {
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, parent.tenantId))
        .limit(1);
      return tenant;
    },
    reviews: async (parent: any) => {
      return db
        .select()
        .from(productReviews)
        .where(eq(productReviews.productId, parent.id));
    },
  },

  Service: {
    tenant: async (parent: any) => {
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, parent.tenantId))
        .limit(1);
      return tenant;
    },
    bookings: async (parent: any) => {
      return db
        .select()
        .from(bookings)
        .where(eq(bookings.serviceId, parent.id));
    },
  },

  Review: {
    product: async (parent: any) => {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, parent.productId))
        .limit(1);
      return product;
    },
  },

  Booking: {
    service: async (parent: any) => {
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, parent.serviceId))
        .limit(1);
      return service;
    },
  },
};
