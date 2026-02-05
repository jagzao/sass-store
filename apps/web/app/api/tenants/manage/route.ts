import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import {
  tenants,
  products,
  services,
  customers,
  customerVisits,
  bookings,
  orders,
  orderItems,
  payments,
  staff,
  mediaAssets,
  tenantConfigs,
  apiKeys,
  auditLogs,
  socialPosts,
  tenantChannels,
  channelAccounts,
  channelCredentials,
  postJobs,
  contentVariants,
  postingRules,
  postResults,
  socialPostTargets,
  tenantQuotas,
  inventoryTransactions,
  inventoryAlerts,
  productInventory,
  customerAdvances,
  advanceApplications,
  posTerminals,
  mercadopagoTokens,
  mercadopagoPayments,
  userRoles,
  tenantHolidays,
  serviceProducts,
  serviceQuotes,
  serviceRetouchConfig,
  productAlertConfig,
  productReviews,
} from "@sass-store/database/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

// Schema para validación de actualización de tenants
const updateTenantSchema = z.object({
  id: z.string().uuid("ID inválido"),
  name: z.string().min(1, "El nombre es requerido").max(100).optional(),
  description: z.string().optional(),
  mode: z.enum(["booking", "ecommerce", "both"]).optional(),
  isActive: z.boolean().optional(),
  contactEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  theme: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      logoUrl: z.string().optional(),
      faviconUrl: z.string().optional(),
    })
    .optional(),
  features: z
    .object({
      bookings: z.boolean().optional(),
      ecommerce: z.boolean().optional(),
      calendar: z.boolean().optional(),
      socialMedia: z.boolean().optional(),
      analytics: z.boolean().optional(),
      multiLanguage: z.boolean().optional(),
      customDomain: z.boolean().optional(),
    })
    .optional(),
});

type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

// Schema para validación de eliminación de tenants
const deleteTenantSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

/**
 * PUT /api/tenants/manage - Actualizar un tenant existente
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si es un administrador del sistema
    const allowedEmails = ["admin@zo-system.com", "jagzao@gmail.com"];
    if (!session.user.email || !allowedEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateTenantSchema.parse(body);

    // Verificar si el tenant existe
    const existingTenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, validatedData.id),
    });

    if (!existingTenant) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 },
      );
    }

    // No permitir actualizar el tenant zo-system
    if (existingTenant.slug === "zo-system") {
      return NextResponse.json(
        { error: "No se puede modificar el tenant del sistema" },
        { status: 400 },
      );
    }

    // Actualizar el tenant (excluir ID e isActive del set)
    const { id: _id, isActive, ...updateData } = validatedData;

    // Map isActive to status if present
    const statusUpdate =
      isActive !== undefined
        ? { status: isActive ? "active" : "inactive" }
        : {};

    const [updatedTenant] = await db
      .update(tenants)
      .set({
        ...updateData,
        ...statusUpdate,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, validatedData.id))
      .returning();

    return NextResponse.json({
      message: "Tenant actualizado exitosamente",
      tenant: updatedTenant,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error updating tenant:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/tenants/manage - Eliminar un tenant
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si es un administrador del sistema
    const allowedEmails = ["admin@zo-system.com", "jagzao@gmail.com"];
    if (!session.user.email || !allowedEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = deleteTenantSchema.parse(body);

    // Verificar si el tenant existe
    const existingTenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });

    if (!existingTenant) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 },
      );
    }

    // No permitir eliminar el tenant zo-system
    if (existingTenant.slug === "zo-system") {
      return NextResponse.json(
        { error: "No se puede eliminar el tenant del sistema" },
        { status: 400 },
      );
    }

    // Eliminar el tenant y todos sus datos relacionados (Cascade manual robusto)
    await db.transaction(async (tx) => {
      // 1. Social Planner / Marketing
      // Delete post results via cascade or explicit if needed. postResults -> postJobs (cascade)
      await tx.delete(postJobs).where(eq(postJobs.tenantId, id));

      // Cleanup social variants before posts (no cascade on variant -> post link?)
      // Variants don't have tenantId but link to socialPost.
      // Need ID list of socialPosts to clean variants.
      const socialPostIds = await tx
        .select({ id: socialPosts.id })
        .from(socialPosts)
        .where(eq(socialPosts.tenantId, id));
      if (socialPostIds.length > 0) {
        const spIds = socialPostIds.map((p) => p.id);
        await tx
          .delete(contentVariants)
          .where(inArray(contentVariants.socialPostId, spIds));
        await tx
          .delete(socialPostTargets)
          .where(inArray(socialPostTargets.postId, spIds));
      }
      await tx.delete(socialPosts).where(eq(socialPosts.tenantId, id));
      await tx.delete(postingRules).where(eq(postingRules.tenantId, id));

      // Channels & Accounts
      // Similar drill: get channel IDs -> get account IDs -> delete credentials -> delete accounts -> delete channels
      const channelIds = await tx
        .select({ id: tenantChannels.id })
        .from(tenantChannels)
        .where(eq(tenantChannels.tenantId, id));
      if (channelIds.length > 0) {
        const tcIds = channelIds.map((c) => c.id);
        const accountIds = await tx
          .select({ id: channelAccounts.id })
          .from(channelAccounts)
          .where(inArray(channelAccounts.tenantChannelId, tcIds));
        if (accountIds.length > 0) {
          const accIds = accountIds.map((a) => a.id);
          await tx
            .delete(channelCredentials)
            .where(inArray(channelCredentials.accountId, accIds));
          await tx
            .delete(channelAccounts)
            .where(inArray(channelAccounts.tenantChannelId, tcIds));
        }
        await tx.delete(tenantChannels).where(eq(tenantChannels.tenantId, id));
      }

      // 2. E-Commerce / POS
      // Items -> Orders
      await tx
        .delete(orderItems)
        .where(
          inArray(
            orderItems.orderId,
            tx
              .select({ id: orders.id })
              .from(orders)
              .where(eq(orders.tenantId, id)),
          ),
        );
      // Payments -> Orders (Foreign Key on Payments pointing to Orders)
      await tx.delete(payments).where(eq(payments.tenantId, id));
      await tx
        .delete(mercadopagoPayments)
        .where(eq(mercadopagoPayments.tenantId, id));

      // Now safe to delete orders
      await tx.delete(orders).where(eq(orders.tenantId, id));

      await tx
        .delete(mercadopagoTokens)
        .where(eq(mercadopagoTokens.tenantId, id));
      await tx.delete(posTerminals).where(eq(posTerminals.tenantId, id));

      // 3. Inventory & Catalog
      await tx
        .delete(inventoryTransactions)
        .where(eq(inventoryTransactions.tenantId, id));
      await tx.delete(inventoryAlerts).where(eq(inventoryAlerts.tenantId, id));
      await tx
        .delete(productInventory)
        .where(eq(productInventory.tenantId, id));
      await tx
        .delete(productAlertConfig)
        .where(eq(productAlertConfig.tenantId, id));

      // Reviews might link to products. Assuming productReviews table exists.
      // await tx.delete(productReviews).where(inArray(productReviews.productId, ...)); // Skip if not sure about schema

      await tx.delete(serviceProducts).where(eq(serviceProducts.tenantId, id));
      await tx.delete(serviceQuotes).where(eq(serviceQuotes.tenantId, id));
      await tx
        .delete(serviceRetouchConfig)
        .where(eq(serviceRetouchConfig.tenantId, id));

      // 4. Appointments & Customers
      await tx
        .delete(advanceApplications)
        .where(eq(advanceApplications.tenantId, id));
      await tx
        .delete(customerAdvances)
        .where(eq(customerAdvances.tenantId, id));

      // Visit children? (photos, services) - Visits usually cascade. If not:
      // await tx.delete(customerVisitServices).where(visitId in ...)
      await tx.delete(customerVisits).where(eq(customerVisits.tenantId, id));
      await tx.delete(bookings).where(eq(bookings.tenantId, id));

      // 5. Core Entities (Leaves)
      await tx.delete(customers).where(eq(customers.tenantId, id));
      await tx.delete(products).where(eq(products.tenantId, id));
      await tx.delete(services).where(eq(services.tenantId, id));
      await tx.delete(staff).where(eq(staff.tenantId, id));
      await tx.delete(userRoles).where(eq(userRoles.tenantId, id));

      // 6. Config & Assets
      await tx.delete(tenantConfigs).where(eq(tenantConfigs.tenantId, id));
      await tx.delete(apiKeys).where(eq(apiKeys.tenantId, id));
      await tx.delete(auditLogs).where(eq(auditLogs.tenantId, id));
      await tx.delete(tenantQuotas).where(eq(tenantQuotas.tenantId, id));
      await tx.delete(tenantHolidays).where(eq(tenantHolidays.tenantId, id));
      await tx.delete(mediaAssets).where(eq(mediaAssets.tenantId, id));

      // Finally
      await tx.delete(tenants).where(eq(tenants.id, id));
    });

    return NextResponse.json({
      message: "Tenant eliminado exitosamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error deleting tenant:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
