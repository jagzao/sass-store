import {
  pgTable,
  text,
  integer,
  decimal,
  timestamp,
  uuid,
  jsonb,
  boolean,
  bigint,
  date,
  varchar,
  primaryKey,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tenants table - central to multitenant architecture
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  mode: varchar('mode', { length: 20 }).notNull().default('catalog'), // 'catalog' | 'booking'
  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active' | 'inactive' | 'suspended'
  branding: jsonb('branding').notNull(),
  contact: jsonb('contact').notNull(),
  location: jsonb('location').notNull(),
  quotas: jsonb('quotas').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  slugIdx: uniqueIndex('tenant_slug_idx').on(table.slug),
  statusIdx: index('tenant_status_idx').on(table.status)
}));

// Products table with RLS
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  sku: varchar('sku', { length: 50 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  featured: boolean('featured').default(false),
  active: boolean('active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  tenantSkuIdx: uniqueIndex('product_tenant_sku_idx').on(table.tenantId, table.sku),
  tenantIdx: index('product_tenant_idx').on(table.tenantId),
  categoryIdx: index('product_category_idx').on(table.category),
  featuredIdx: index('product_featured_idx').on(table.featured)
}));

// Services table
export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  duration: integer('duration').notNull(), // minutes
  featured: boolean('featured').default(false),
  active: boolean('active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  tenantIdx: index('service_tenant_idx').on(table.tenantId),
  featuredIdx: index('service_featured_idx').on(table.featured)
}));

// Staff table
export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  specialties: jsonb('specialties').notNull().default('[]'),
  photo: text('photo'),
  googleCalendarId: varchar('google_calendar_id', { length: 255 }),
  active: boolean('active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  tenantIdx: index('staff_tenant_idx').on(table.tenantId),
  emailIdx: index('staff_email_idx').on(table.email)
}));

// Orders table - for e-commerce transactions
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  orderNumber: varchar('order_number', { length: 100 }).unique().notNull(),
  customerName: varchar('customer_name', { length: 100 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 20 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'paid' | 'payment_failed' | 'payment_pending' | 'disputed'
  type: varchar('type', { length: 20 }).notNull().default('purchase'), // 'purchase' | 'booking'
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('MXN'),
  paymentIntentId: varchar('payment_intent_id', { length: 255 }),
  paidAt: timestamp('paid_at'),
  shippingAddress: jsonb('shipping_address'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  tenantIdx: index('order_tenant_idx').on(table.tenantId),
  orderNumberIdx: uniqueIndex('order_number_idx').on(table.orderNumber),
  statusIdx: index('order_status_idx').on(table.status),
  paymentIntentIdx: index('order_payment_intent_idx').on(table.paymentIntentId),
  createdIdx: index('order_created_idx').on(table.createdAt)
}));

// Order Items table
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'product' | 'service'
  name: varchar('name', { length: 200 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  orderIdx: index('order_item_order_idx').on(table.orderId)
}));

// Bookings table
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  staffId: uuid('staff_id').references(() => staff.id),
  customerName: varchar('customer_name', { length: 100 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 20 }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: text('notes'),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  googleEventId: varchar('google_event_id', { length: 255 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  tenantIdx: index('booking_tenant_idx').on(table.tenantId),
  serviceIdx: index('booking_service_idx').on(table.serviceId),
  staffIdx: index('booking_staff_idx').on(table.staffId),
  timeIdx: index('booking_time_idx').on(table.startTime),
  statusIdx: index('booking_status_idx').on(table.status)
}));

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  products: many(products),
  services: many(services),
  staff: many(staff),
  bookings: many(bookings),
  orders: many(orders)
}));

export const productsRelations = relations(products, ({ one }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id]
  })
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [services.tenantId],
    references: [tenants.id]
  }),
  bookings: many(bookings)
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [staff.tenantId],
    references: [tenants.id]
  }),
  bookings: many(bookings)
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id]
  }),
  items: many(orderItems)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  })
}));

// Payments table
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('MXN'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paidAt: timestamp('paid_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  orderIdx: index('payment_order_idx').on(table.orderId),
  tenantIdx: index('payment_tenant_idx').on(table.tenantId),
  stripeIdx: index('payment_stripe_idx').on(table.stripePaymentIntentId)
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id]
  }),
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id]
  })
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [bookings.tenantId],
    references: [tenants.id]
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id]
  }),
  staff: one(staff, {
    fields: [bookings.staffId],
    references: [staff.id]
  })
}));

// Social Media Tables
export const socialPosts = pgTable('social_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  title: varchar('title', { length: 200 }),
  baseText: text('base_text').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft' | 'scheduled' | 'published' | 'failed' | 'canceled'
  scheduledAtUtc: timestamp('scheduled_at_utc'),
  timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
  createdBy: varchar('created_by', { length: 100 }).notNull().default('system'),
  updatedBy: varchar('updated_by', { length: 100 }).notNull().default('system'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  tenantIdx: index('social_post_tenant_idx').on(table.tenantId),
  statusIdx: index('social_post_status_idx').on(table.status),
  scheduledIdx: index('social_post_scheduled_idx').on(table.scheduledAtUtc),
  createdIdx: index('social_post_created_idx').on(table.createdAt)
}));

export const socialPostTargets = pgTable('social_post_targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').references(() => socialPosts.id).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(), // 'facebook' | 'instagram' | 'linkedin' | 'x' | 'tiktok' | 'gbp' | 'threads'
  publishAtUtc: timestamp('publish_at_utc'),
  timezone: varchar('timezone', { length: 100 }).notNull().default('America/Mexico_City'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  variantText: text('variant_text'),
  platformPostId: varchar('platform_post_id', { length: 255 }),
  externalRef: varchar('external_ref', { length: 255 }),
  error: text('error'),
  assetIds: jsonb('asset_ids').notNull().default('[]'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  postIdx: index('social_target_post_idx').on(table.postId),
  platformIdx: index('social_target_platform_idx').on(table.platform),
  publishIdx: index('social_target_publish_idx').on(table.publishAtUtc),
  statusIdx: index('social_target_status_idx').on(table.status)
}));

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  assetType: varchar('asset_type', { length: 50 }).notNull(), // 'product' | 'service' | 'post' | 'profile'
  entityId: uuid('entity_id'), // ID of the related entity (product, service, etc.)
  filename: varchar('filename', { length: 500 }).notNull(),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  originalSize: integer('original_size').notNull(),
  totalSize: integer('total_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  width: integer('width'),
  height: integer('height'),
  dominantColor: varchar('dominant_color', { length: 7 }),
  blurhash: varchar('blurhash', { length: 100 }),
  variants: jsonb('variants').notNull().default('{}'), // Different sizes/formats
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  tenantIdx: index('media_asset_tenant_idx').on(table.tenantId),
  typeIdx: index('media_asset_type_idx').on(table.assetType),
  entityIdx: index('media_asset_entity_idx').on(table.entityId),
  hashIdx: uniqueIndex('media_asset_hash_idx').on(table.contentHash)
}));

// Social Media Relations
export const socialPostsRelations = relations(socialPosts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [socialPosts.tenantId],
    references: [tenants.id]
  }),
  targets: many(socialPostTargets)
}));

export const socialPostTargetsRelations = relations(socialPostTargets, ({ one }) => ({
  post: one(socialPosts, {
    fields: [socialPostTargets.postId],
    references: [socialPosts.id]
  })
}));

// Disputes table for tracking payment disputes
export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  paymentId: uuid('payment_id').references(() => payments.id).notNull(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'warning_needs_response' | 'warning_under_review' | 'warning_closed' | 'needs_response' | 'under_review' | 'charge_refunded' | 'won' | 'lost'
  reason: varchar('reason', { length: 50 }).notNull(), // 'duplicate' | 'fraudulent' | 'subscription_canceled' | 'product_unacceptable' | 'product_not_received' | 'unrecognized' | 'credit_not_processed' | 'general'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('MXN'),
  evidenceDueBy: timestamp('evidence_due_by'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  tenantIdx: index('dispute_tenant_idx').on(table.tenantId),
  paymentIdx: index('dispute_payment_idx').on(table.paymentId),
  orderIdx: index('dispute_order_idx').on(table.orderId),
  statusIdx: index('dispute_status_idx').on(table.status),
  reasonIdx: index('dispute_reason_idx').on(table.reason)
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  tenant: one(tenants, {
    fields: [disputes.tenantId],
    references: [tenants.id]
  }),
  payment: one(payments, {
    fields: [disputes.paymentId],
    references: [payments.id]
  }),
  order: one(orders, {
    fields: [disputes.orderId],
    references: [orders.id]
  })
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  tenant: one(tenants, {
    fields: [mediaAssets.tenantId],
    references: [tenants.id]
  })
}));