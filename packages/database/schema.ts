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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Tenants table - central to multitenant architecture
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 50 }).unique().notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    mode: varchar("mode", { length: 20 }).notNull().default("catalog"), // 'catalog' | 'booking'
    status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' | 'inactive' | 'suspended'
    timezone: varchar("timezone", { length: 50 }).notNull().default("America/Mexico_City"),
    branding: jsonb("branding").notNull(),
    contact: jsonb("contact").notNull(),
    location: jsonb("location").notNull(),
    quotas: jsonb("quotas").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("tenant_slug_idx").on(table.slug),
    statusIdx: index("tenant_status_idx").on(table.status),
  })
);

// Products table with RLS
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    sku: varchar("sku", { length: 50 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    featured: boolean("featured").default(false),
    active: boolean("active").default(true),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantSkuIdx: uniqueIndex("product_tenant_sku_idx").on(
      table.tenantId,
      table.sku
    ),
    tenantIdx: index("product_tenant_idx").on(table.tenantId),
    categoryIdx: index("product_category_idx").on(table.category),
    featuredIdx: index("product_featured_idx").on(table.featured),
  })
);

// Services table
export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    duration: integer("duration").notNull(), // minutes
    featured: boolean("featured").default(false),
    active: boolean("active").default(true),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("service_tenant_idx").on(table.tenantId),
    featuredIdx: index("service_featured_idx").on(table.featured),
  })
);

// Staff table
export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    role: varchar("role", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    specialties: jsonb("specialties").notNull().default("[]"),
    photo: text("photo"),
    googleCalendarId: varchar("google_calendar_id", { length: 255 }),
    active: boolean("active").default(true),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("staff_tenant_idx").on(table.tenantId),
    emailIdx: index("staff_email_idx").on(table.email),
  })
);

// Bookings table
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    serviceId: uuid("service_id")
      .references(() => services.id)
      .notNull(),
    staffId: uuid("staff_id").references(() => staff.id),
    customerName: varchar("customer_name", { length: 100 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
    customerPhone: varchar("customer_phone", { length: 20 }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'confirmed' | 'completed' | 'cancelled'
    notes: text("notes"),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    googleEventId: varchar("google_event_id", { length: 255 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("booking_tenant_idx").on(table.tenantId),
    serviceIdx: index("booking_service_idx").on(table.serviceId),
    staffIdx: index("booking_staff_idx").on(table.staffId),
    timeIdx: index("booking_time_idx").on(table.startTime),
    statusIdx: index("booking_status_idx").on(table.status),
  })
);

// Media Assets table
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    assetType: varchar("asset_type", { length: 50 }).notNull(), // 'product' | 'staff' | 'service' | 'branding' | 'gallery'
    entityId: varchar("entity_id", { length: 100 }), // SKU, staff_id, service_id, etc.
    filename: varchar("filename", { length: 255 }).notNull(),
    contentHash: varchar("content_hash", { length: 64 }).unique().notNull(), // SHA-256 for deduplication
    originalSize: bigint("original_size", { mode: "number" }).notNull(),
    totalSize: bigint("total_size", { mode: "number" }).notNull(), // Sum of all variants
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    width: integer("width"),
    height: integer("height"),
    dominantColor: varchar("dominant_color", { length: 7 }), // Hex color
    blurhash: varchar("blurhash", { length: 255 }),
    variants: jsonb("variants").notNull(), // Array of available variants
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantTypeIdx: index("media_tenant_type_idx").on(
      table.tenantId,
      table.assetType
    ),
    entityIdx: index("media_entity_idx").on(table.tenantId, table.entityId),
    hashIdx: uniqueIndex("media_hash_idx").on(table.contentHash),
  })
);

// Tenant Quotas tracking
export const tenantQuotas = pgTable("tenant_quotas", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id),
  storageUsedBytes: bigint("storage_used_bytes", { mode: "number" }).default(0),
  storageLimitBytes: bigint("storage_limit_bytes", { mode: "number" }).default(
    5368709120
  ), // 5GB default
  mediaCount: integer("media_count").default(0),
  mediaLimit: integer("media_limit").default(1000),
  bandwidthUsedBytes: bigint("bandwidth_used_bytes", {
    mode: "number",
  }).default(0),
  bandwidthLimitBytes: bigint("bandwidth_limit_bytes", {
    mode: "number",
  }).default(53687091200), // 50GB default
  resetDate: date("reset_date").default(
    sql`(CURRENT_DATE + INTERVAL '30 days')`
  ), // Next month
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table - for e-commerce transactions
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    orderNumber: varchar("order_number", { length: 100 }).unique().notNull(),
    customerName: varchar("customer_name", { length: 100 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
    customerPhone: varchar("customer_phone", { length: 20 }),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'confirmed' | 'completed' | 'cancelled'
    type: varchar("type", { length: 20 }).notNull().default("purchase"), // 'purchase' | 'booking'
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("order_tenant_idx").on(table.tenantId),
    orderNumberIdx: uniqueIndex("order_number_idx").on(table.orderNumber),
    statusIdx: index("order_status_idx").on(table.status),
    createdIdx: index("order_created_idx").on(table.createdAt),
  })
);

// Order Items table
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id)
      .notNull(),
    type: varchar("type", { length: 20 }).notNull(), // 'product' | 'service'
    name: varchar("name", { length: 200 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    orderIdx: index("order_item_order_idx").on(table.orderId),
  })
);

// Payments table
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id)
      .notNull(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    paidAt: timestamp("paid_at"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    orderIdx: index("payment_order_idx").on(table.orderId),
    tenantIdx: index("payment_tenant_idx").on(table.tenantId),
    stripeIdx: index("payment_stripe_idx").on(table.stripePaymentIntentId),
  })
);

// Audit Trail - Enhanced for social planner
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id),
    actorId: uuid("actor_id"), // User or "system"
    action: text("action").notNull(), // oauth.linked, job.created, post.published, etc.
    targetTable: text("target_table"),
    targetId: uuid("target_id"),
    data: jsonb("data").notNull().default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index("audit_logs_tenant_idx").on(table.tenantId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
    createdIdx: index("audit_logs_created_idx").on(table.createdAt),
  })
);

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  products: many(products),
  services: many(services),
  staff: many(staff),
  bookings: many(bookings),
  orders: many(orders),
  mediaAssets: many(mediaAssets),
  auditLogs: many(auditLogs),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  reviews: many(productReviews),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [services.tenantId],
    references: [tenants.id],
  }),
  bookings: many(bookings),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [staff.tenantId],
    references: [tenants.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [bookings.tenantId],
    references: [tenants.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  staff: one(staff, {
    fields: [bookings.staffId],
    references: [staff.id],
  }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  tenant: one(tenants, {
    fields: [mediaAssets.tenantId],
    references: [tenants.id],
  }),
}));

// Social Planner Tables - Complete schema for multi-channel social media management
// 1. Tenant channels configuration
export const tenantChannels = pgTable(
  "tenant_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    channel: varchar("channel", { length: 50 }).notNull(), // linkedin|facebook|instagram|tiktok|whatsapp_business
    enabled: boolean("enabled").notNull().default(true),
    limitsPerDay: integer("limits_per_day").notNull().default(1),
    postingWindow: jsonb("posting_window").notNull().default("{}"), // { start:"19:00", end:"23:00", tz:"America/Mexico_City" }
    defaultHashtags: text("default_hashtags").array().notNull().default(sql`ARRAY[]::text[]`),
    policy: jsonb("policy").notNull().default("{}"), // Channel-specific rules
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantChannelUnique: uniqueIndex("tenant_channels_tenant_channel_idx").on(
      table.tenantId,
      table.channel
    ),
    tenantIdx: index("tenant_channels_tenant_idx").on(table.tenantId),
  })
);

// 2. Channel accounts (FB page, IG business, LinkedIn org, etc.)
export const channelAccounts = pgTable(
  "channel_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantChannelId: uuid("tenant_channel_id")
      .references(() => tenantChannels.id)
      .notNull(),
    externalRef: jsonb("external_ref").notNull().default("{}"), // { page_id, ig_user_id, linkedin_org_id }
    label: text("label"),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active|revoked
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantChannelIdx: index("channel_accounts_tenant_channel_idx").on(
      table.tenantChannelId
    ),
  })
);

// 3. Channel credentials (encrypted tokens)
export const channelCredentials = pgTable(
  "channel_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .references(() => channelAccounts.id)
      .notNull(),
    accessTokenEnc: text("access_token_enc").notNull(),
    refreshTokenEnc: text("refresh_token_enc"),
    tokenType: text("token_type"),
    scopes: text("scopes").array(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    meta: jsonb("meta").notNull().default("{}"), // { app_id, client_id }
    status: varchar("status", { length: 20 }).notNull().default("ok"), // ok|revoked|expired
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    accountIdx: index("channel_credentials_account_idx").on(table.accountId),
  })
);

// 4. Social posts (channel-agnostic content)
export const socialPosts = pgTable(
  "social_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    title: text("title"),
    bodyMd: text("body_md"),
    mediaIds: uuid("media_ids").array().notNull().default(sql`ARRAY[]::uuid[]`),
    tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
    dueDate: date("due_date"),
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft|ready|archived
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index("social_posts_tenant_idx").on(table.tenantId),
    statusIdx: index("social_posts_status_idx").on(table.status),
  })
);

// 5. Content variants (channel-specific versions)
export const contentVariants = pgTable(
  "content_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    socialPostId: uuid("social_post_id")
      .references(() => socialPosts.id)
      .notNull(),
    channel: varchar("channel", { length: 50 }).notNull(),
    title: text("title"),
    bodyMd: text("body_md"),
    mediaIds: uuid("media_ids").array().notNull().default(sql`ARRAY[]::uuid[]`),
    payload: jsonb("payload").notNull().default("{}"), // { utm, first_comment, cover_sec }
    status: varchar("status", { length: 20 }).notNull().default("ready"), // ready|blocked
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    socialPostChannelIdx: index("content_variants_post_channel_idx").on(
      table.socialPostId,
      table.channel
    ),
  })
);

// 6. Posting rules (scheduling configuration)
export const postingRules = pgTable(
  "posting_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    channel: varchar("channel", { length: 50 }).notNull(),
    frequency: text("frequency").notNull(), // cron or RRULE
    maxPerDay: integer("max_per_day").notNull().default(1),
    priority: integer("priority").notNull().default(0),
    daysOff: integer("days_off").array().notNull().default(sql`ARRAY[]::integer[]`), // 0=sunday..6=saturday
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index("posting_rules_tenant_idx").on(table.tenantId),
  })
);

// 7. Post jobs (publication pipeline)
export const postJobs = pgTable(
  "post_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    channel: varchar("channel", { length: 50 }).notNull(),
    contentVariantId: uuid("content_variant_id")
      .references(() => contentVariants.id)
      .notNull(),
    accountId: uuid("account_id")
      .references(() => channelAccounts.id)
      .notNull(),
    runAt: timestamp("run_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("queued"), // queued|running|ok|failed|canceled|skipped
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    idempotencyKey: text("idempotency_key").unique(),
    priority: integer("priority").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantStatusRunAtIdx: index("post_jobs_tenant_status_run_at_idx").on(
      table.tenantId,
      table.status,
      table.runAt
    ),
    statusRunAtIdx: index("post_jobs_status_run_at_idx").on(
      table.status,
      table.runAt
    ),
  })
);

// 8. Post results (publication outcomes)
export const postResults = pgTable(
  "post_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postJobId: uuid("post_job_id")
      .references(() => postJobs.id, { onDelete: "cascade" })
      .notNull(),
    externalId: text("external_id"),
    permalink: text("permalink"),
    response: jsonb("response").notNull().default("{}"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    postJobIdx: index("post_results_post_job_idx").on(table.postJobId),
  })
);

// 9. Media renditions (optional transformations)
export const mediaRenditions = pgTable(
  "media_renditions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mediaId: uuid("media_id")
      .references(() => mediaAssets.id)
      .notNull(),
    preset: text("preset").notNull(), // feed_1_1|story_9_16|reel_video
    url: text("url").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    mediaIdx: index("media_renditions_media_idx").on(table.mediaId),
  })
);

// Social Planner Relations
export const tenantChannelsRelations = relations(
  tenantChannels,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [tenantChannels.tenantId],
      references: [tenants.id],
    }),
    accounts: many(channelAccounts),
  })
);

export const channelAccountsRelations = relations(
  channelAccounts,
  ({ one, many }) => ({
    tenantChannel: one(tenantChannels, {
      fields: [channelAccounts.tenantChannelId],
      references: [tenantChannels.id],
    }),
    credentials: many(channelCredentials),
    postJobs: many(postJobs),
  })
);

export const channelCredentialsRelations = relations(
  channelCredentials,
  ({ one }) => ({
    account: one(channelAccounts, {
      fields: [channelCredentials.accountId],
      references: [channelAccounts.id],
    }),
  })
);

export const socialPostsRelations = relations(socialPosts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [socialPosts.tenantId],
    references: [tenants.id],
  }),
  variants: many(contentVariants),
}));

export const contentVariantsRelations = relations(
  contentVariants,
  ({ one, many }) => ({
    socialPost: one(socialPosts, {
      fields: [contentVariants.socialPostId],
      references: [socialPosts.id],
    }),
    postJobs: many(postJobs),
  })
);

export const postingRulesRelations = relations(postingRules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [postingRules.tenantId],
    references: [tenants.id],
  }),
}));

export const postJobsRelations = relations(postJobs, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [postJobs.tenantId],
    references: [tenants.id],
  }),
  contentVariant: one(contentVariants, {
    fields: [postJobs.contentVariantId],
    references: [contentVariants.id],
  }),
  account: one(channelAccounts, {
    fields: [postJobs.accountId],
    references: [channelAccounts.id],
  }),
  results: many(postResults),
}));

export const postResultsRelations = relations(postResults, ({ one }) => ({
  postJob: one(postJobs, {
    fields: [postResults.postJobId],
    references: [postJobs.id],
  }),
}));

export const mediaRenditionsRelations = relations(mediaRenditions, ({ one }) => ({
  media: one(mediaAssets, {
    fields: [mediaRenditions.mediaId],
    references: [mediaAssets.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
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

// NextAuth.js Authentication Tables
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  password: text("password"), // For credentials-based auth
  phone: varchar("phone", { length: 20 }),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
    providerIdx: index("accounts_provider_idx").on(table.provider),
    providerAccountIdIdx: index("accounts_provider_account_id_idx").on(
      table.providerAccountId
    ),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    sessionToken: text("session_token").unique().notNull(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
    sessionTokenIdx: index("sessions_session_token_idx").on(table.sessionToken),
  })
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").unique().notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tokenIdx: index("verification_tokens_token_idx").on(table.token),
    identifierIdx: index("verification_tokens_identifier_idx").on(
      table.identifier
    ),
  })
);

// Authentication Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  reviews: many(productReviews),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Product Reviews table
export const productReviews = pgTable(
  "product_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id").references(() => users.id),
    customerName: varchar("customer_name", { length: 100 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
    rating: integer("rating").notNull(), // 1-5
    title: varchar("title", { length: 200 }),
    comment: text("comment"),
    verified: boolean("verified").default(false), // Verified purchase
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
    helpful: integer("helpful").default(0), // Helpful count
    reported: integer("reported").default(0), // Report count
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("review_tenant_idx").on(table.tenantId),
    productIdx: index("review_product_idx").on(table.productId),
    userIdx: index("review_user_idx").on(table.userId),
    ratingIdx: index("review_rating_idx").on(table.rating),
    statusIdx: index("review_status_idx").on(table.status),
    createdIdx: index("review_created_idx").on(table.createdAt),
    productStatusIdx: index("review_product_status_idx").on(
      table.productId,
      table.status
    ),
  })
);

// Review Relations
export const productReviewsRelations = relations(
  productReviews,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [productReviews.tenantId],
      references: [tenants.id],
    }),
    product: one(products, {
      fields: [productReviews.productId],
      references: [products.id],
    }),
    user: one(users, {
      fields: [productReviews.userId],
      references: [users.id],
    }),
  })
);
