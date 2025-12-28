import { relations } from "drizzle-orm/relations";
import {
  tenants,
  oauthStateTokens,
  userRoles,
  users,
  bookings,
  customerVisits,
  customers,
  socialPosts,
  socialPostTargets,
  userCarts,
  campaigns,
  reels,
  clients,
  posts,
  socialTokens,
  metrics,
  logs,
  visitPhotos,
  services,
  tenantQuotas,
  products,
  auditLogs,
  staff,
  apiKeys,
  sessions,
  orders,
  payments,
  productReviews,
  orderItems,
  accounts,
  mediaAssets,
} from "./schema";

export const oauthStateTokensRelations = relations(
  oauthStateTokens,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [oauthStateTokens.tenantId],
      references: [tenants.id],
    }),
  }),
);

export const tenantsRelations = relations(tenants, ({ many }) => ({
  oauthStateTokens: many(oauthStateTokens),
  userRoles: many(userRoles),
  customerVisits: many(customerVisits),
  campaigns: many(campaigns),
  reels: many(reels),
  services: many(services),
  tenantQuotas: many(tenantQuotas),
  products: many(products),
  auditLogs: many(auditLogs),
  staff: many(staff),
  apiKeys: many(apiKeys),
  bookings: many(bookings),
  orders: many(orders),
  payments: many(payments),
  productReviews: many(productReviews),
  mediaAssets: many(mediaAssets),
  socialPosts: many(socialPosts),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  tenant: one(tenants, {
    fields: [userRoles.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  userCarts: many(userCarts),
  sessions: many(sessions),
  productReviews: many(productReviews),
  accounts: many(accounts),
}));

export const customerVisitsRelations = relations(
  customerVisits,
  ({ one, many }) => ({
    booking: one(bookings, {
      fields: [customerVisits.appointmentId],
      references: [bookings.id],
    }),
    customer: one(customers, {
      fields: [customerVisits.customerId],
      references: [customers.id],
    }),
    tenant: one(tenants, {
      fields: [customerVisits.tenantId],
      references: [tenants.id],
    }),
    visitPhotos: many(visitPhotos),
  }),
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customerVisits: many(customerVisits),
  customer: one(customers, {
    fields: [bookings.customerId],
    references: [customers.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  staff: one(staff, {
    fields: [bookings.staffId],
    references: [staff.id],
  }),
  tenant: one(tenants, {
    fields: [bookings.tenantId],
    references: [tenants.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  customerVisits: many(customerVisits),
  bookings: many(bookings),
}));

export const socialPostTargetsRelations = relations(
  socialPostTargets,
  ({ one }) => ({
    socialPost: one(socialPosts, {
      fields: [socialPostTargets.postId],
      references: [socialPosts.id],
    }),
  }),
);

export const socialPostsRelations = relations(socialPosts, ({ one, many }) => ({
  socialPostTargets: many(socialPostTargets),
  tenant: one(tenants, {
    fields: [socialPosts.tenantId],
    references: [tenants.id],
  }),
}));

export const userCartsRelations = relations(userCarts, ({ one }) => ({
  user: one(users, {
    fields: [userCarts.userId],
    references: [users.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [campaigns.tenantId],
    references: [tenants.id],
  }),
  reels: many(reels),
}));

export const reelsRelations = relations(reels, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [reels.campaignId],
    references: [campaigns.id],
  }),
  tenant: one(tenants, {
    fields: [reels.tenantId],
    references: [tenants.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  client: one(clients, {
    fields: [posts.clientId],
    references: [clients.id],
  }),
  logs: many(logs),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  posts: many(posts),
  socialTokens: many(socialTokens),
  metrics: many(metrics),
  logs: many(logs),
}));

export const socialTokensRelations = relations(socialTokens, ({ one }) => ({
  client: one(clients, {
    fields: [socialTokens.clientId],
    references: [clients.id],
  }),
}));

export const metricsRelations = relations(metrics, ({ one }) => ({
  client: one(clients, {
    fields: [metrics.clientId],
    references: [clients.id],
  }),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  client: one(clients, {
    fields: [logs.clientId],
    references: [clients.id],
  }),
  post: one(posts, {
    fields: [logs.postId],
    references: [posts.id],
  }),
}));

export const visitPhotosRelations = relations(visitPhotos, ({ one }) => ({
  customerVisit: one(customerVisits, {
    fields: [visitPhotos.visitId],
    references: [customerVisits.id],
  }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [services.tenantId],
    references: [tenants.id],
  }),
  bookings: many(bookings),
}));

export const tenantQuotasRelations = relations(tenantQuotas, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantQuotas.tenantId],
    references: [tenants.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  productReviews: many(productReviews),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [staff.tenantId],
    references: [tenants.id],
  }),
  bookings: many(bookings),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  tenant: one(tenants, {
    fields: [apiKeys.tenantId],
    references: [tenants.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  payments: many(payments),
  orderItems: many(orderItems),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id],
  }),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  tenant: one(tenants, {
    fields: [productReviews.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [productReviews.userId],
    references: [users.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  tenant: one(tenants, {
    fields: [mediaAssets.tenantId],
    references: [tenants.id],
  }),
}));
