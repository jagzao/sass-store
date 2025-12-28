import {
  pgTable,
  index,
  uniqueIndex,
  foreignKey,
  unique,
  uuid,
  varchar,
  boolean,
  timestamp,
  text,
  integer,
  numeric,
  date,
  jsonb,
  pgPolicy,
  serial,
  json,
  doublePrecision,
  bigint,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const customerStatus = pgEnum("customer_status", [
  "active",
  "inactive",
  "blocked",
]);
export const loglevel = pgEnum("loglevel", [
  "DEBUG",
  "INFO",
  "WARNING",
  "ERROR",
  "CRITICAL",
]);
export const poststatus = pgEnum("poststatus", [
  "DRAFT",
  "SCHEDULED",
  "PUBLISHING",
  "PUBLISHED",
  "FAILED",
]);
export const roles = pgEnum("roles", [
  "Admin",
  "Gerente",
  "Personal",
  "Cliente",
]);
export const socialplatform = pgEnum("socialplatform", [
  "LINKEDIN",
  "GITHUB",
  "FACEBOOK",
  "INSTAGRAM",
  "WHATSAPP",
  "TIKTOK",
]);
export const userrole = pgEnum("userrole", [
  "SUPER_ADMIN",
  "CLIENT_ADMIN",
  "CLIENT_USER",
]);
export const visitPhotoType = pgEnum("visit_photo_type", ["BEFORE", "AFTER"]);
export const visitStatus = pgEnum("visit_status", [
  "pending",
  "scheduled",
  "completed",
  "cancelled",
]);

export const oauthStateTokens = pgTable(
  "oauth_state_tokens",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    state: varchar({ length: 64 }).notNull(),
    tenantId: uuid("tenant_id").notNull(),
    provider: varchar({ length: 50 }).notNull(),
    used: boolean().default(false).notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("oauth_state_tokens_expires_idx").using(
      "btree",
      table.expiresAt.asc().nullsLast().op("timestamp_ops"),
    ),
    uniqueIndex("oauth_state_tokens_state_idx").using(
      "btree",
      table.state.asc().nullsLast().op("text_ops"),
    ),
    index("oauth_state_tokens_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "oauth_state_tokens_tenant_id_tenants_id_fk",
    }),
    unique("oauth_state_tokens_state_unique").on(table.state),
  ],
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    tenantId: uuid("tenant_id").notNull(),
    role: roles().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("user_roles_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    index("user_roles_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    uniqueIndex("user_roles_user_tenant_unique_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
      table.tenantId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "user_roles_tenant_id_tenants_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "user_roles_user_id_users_id_fk",
    }),
  ],
);

export const customerVisits = pgTable(
  "customer_visits",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    customerId: uuid("customer_id").notNull(),
    appointmentId: uuid("appointment_id"),
    visitNumber: integer("visit_number").notNull(),
    visitDate: timestamp("visit_date", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    notes: text(),
    nextVisitFrom: date("next_visit_from"),
    nextVisitTo: date("next_visit_to"),
    status: visitStatus().default("completed").notNull(),
    metadata: jsonb().default({}),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("customer_visits_appointment_idx").using(
      "btree",
      table.appointmentId.asc().nullsLast().op("uuid_ops"),
    ),
    index("customer_visits_customer_idx").using(
      "btree",
      table.customerId.asc().nullsLast().op("uuid_ops"),
    ),
    index("customer_visits_date_idx").using(
      "btree",
      table.visitDate.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("customer_visits_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    index("customer_visits_tenant_customer_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
      table.customerId.asc().nullsLast().op("uuid_ops"),
    ),
    index("customer_visits_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.appointmentId],
      foreignColumns: [bookings.id],
      name: "customer_visits_appointment_id_bookings_id_fk",
    }),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: "customer_visits_customer_id_customers_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "customer_visits_tenant_id_tenants_id_fk",
    }),
  ],
);

export const socialPostTargets = pgTable(
  "social_post_targets",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    postId: uuid("post_id").notNull(),
    platform: varchar({ length: 50 }).notNull(),
    publishAtUtc: timestamp("publish_at_utc", { mode: "string" }),
    timezone: varchar({ length: 100 }).default("America/Mexico_City").notNull(),
    status: varchar({ length: 20 }).default("draft").notNull(),
    variantText: text("variant_text"),
    platformPostId: varchar("platform_post_id", { length: 255 }),
    externalRef: varchar("external_ref", { length: 255 }),
    error: text(),
    assetIds: jsonb("asset_ids").default([]).notNull(),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("idx_social_post_targets_platform").using(
      "btree",
      table.platform.asc().nullsLast().op("text_ops"),
    ),
    index("idx_social_post_targets_platform_status").using(
      "btree",
      table.platform.asc().nullsLast().op("text_ops"),
      table.status.asc().nullsLast().op("text_ops"),
    ),
    index("idx_social_post_targets_post_id").using(
      "btree",
      table.postId.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_social_post_targets_publish_at").using(
      "btree",
      table.publishAtUtc.asc().nullsLast().op("timestamp_ops"),
    ),
    index("idx_social_post_targets_status").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.postId],
      foreignColumns: [socialPosts.id],
      name: "social_post_targets_post_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const userCarts = pgTable(
  "user_carts",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    items: jsonb().default([]).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("user_carts_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "user_carts_user_id_users_id_fk",
    }).onDelete("cascade"),
  ],
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    name: text().notNull(),
    type: text().notNull(),
    slug: text().notNull(),
    lutFile: text("lut_file"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("campaigns_slug_idx").using(
      "btree",
      table.slug.asc().nullsLast().op("text_ops"),
    ),
    index("campaigns_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    index("campaigns_type_idx").using(
      "btree",
      table.type.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "campaigns_tenant_id_tenants_id_fk",
    }),
    unique("campaigns_tenant_id_slug_key").on(table.tenantId, table.slug),
    pgPolicy("campaigns_service_role_all", {
      as: "permissive",
      for: "all",
      to: ["service_role"],
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("campaigns_authenticated_all", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
    }),
    pgPolicy("campaigns_anon_read", {
      as: "permissive",
      for: "select",
      to: ["anon"],
    }),
  ],
);

export const reels = pgTable(
  "reels",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    campaignId: uuid("campaign_id"),
    title: text().notNull(),
    status: text().default("pending").notNull(),
    imageUrls: text("image_urls")
      .array()
      .default(sql`ARRAY[]::text[]`)
      .notNull(),
    overlayType: text("overlay_type").notNull(),
    musicFile: text("music_file").notNull(),
    duration: numeric({ precision: 10, scale: 2 }).default("0"),
    hashtags: text()
      .array()
      .default(sql`ARRAY[]::text[]`),
    caption: text().default(""),
    metadata: jsonb().default({}),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("reels_campaign_idx").using(
      "btree",
      table.campaignId.asc().nullsLast().op("uuid_ops"),
    ),
    index("reels_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
    ),
    index("reels_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.campaignId],
      foreignColumns: [campaigns.id],
      name: "reels_campaign_id_campaigns_id_fk",
    }),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "reels_tenant_id_tenants_id_fk",
    }),
    pgPolicy("reels_service_role_all", {
      as: "permissive",
      for: "all",
      to: ["service_role"],
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("reels_authenticated_all", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
    }),
    pgPolicy("reels_anon_read", {
      as: "permissive",
      for: "select",
      to: ["anon"],
    }),
    pgPolicy("allow_all_reels", {
      as: "permissive",
      for: "all",
      to: ["public"],
    }),
  ],
);

export const customerVisitServices = pgTable(
  "customer_visit_services",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    visitId: uuid("visit_id").notNull(),
    serviceId: uuid("service_id").notNull(),
    description: text(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: numeric({ precision: 5, scale: 2 }).default("1").notNull(),
    subtotal: numeric({ precision: 10, scale: 2 }).notNull(),
    metadata: jsonb().default({}),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("customer_visit_services_service_idx").using(
      "btree",
      table.serviceId.asc().nullsLast().op("uuid_ops"),
    ),
    index("customer_visit_services_visit_idx").using(
      "btree",
      table.visitId.asc().nullsLast().op("uuid_ops"),
    ),
  ],
);

export const channelAccounts = pgTable(
  "channel_accounts",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantChannelId: uuid("tenant_channel_id").notNull(),
    externalRef: jsonb("external_ref").default({}).notNull(),
    label: text(),
    status: varchar({ length: 20 }).default("active").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("channel_accounts_tenant_channel_idx").using(
      "btree",
      table.tenantChannelId.asc().nullsLast().op("uuid_ops"),
    ),
  ],
);

export const contentVariants = pgTable(
  "content_variants",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    socialPostId: uuid("social_post_id").notNull(),
    channel: varchar({ length: 50 }).notNull(),
    title: text(),
    bodyMd: text("body_md"),
    mediaIds: uuid("media_ids").array().default(["RAY"]).notNull(),
    payload: jsonb().default({}).notNull(),
    status: varchar({ length: 20 }).default("ready").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("content_variants_post_channel_idx").using(
      "btree",
      table.socialPostId.asc().nullsLast().op("text_ops"),
      table.channel.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const clients = pgTable(
  "clients",
  {
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    company: varchar({ length: 255 }),
    description: text(),
    isActive: boolean("is_active").notNull(),
    csrfToken: varchar("csrf_token", { length: 255 }),
    id: serial().primaryKey().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    uniqueIndex("ix_clients_email").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops"),
    ),
    index("ix_clients_id").using(
      "btree",
      table.id.asc().nullsLast().op("int4_ops"),
    ),
  ],
);

export const posts = pgTable(
  "posts",
  {
    title: varchar({ length: 255 }).notNull(),
    content: text(),
    originalContent: text("original_content"),
    generatedContent: text("generated_content"),
    imageUrl: varchar("image_url", { length: 500 }),
    mediaPath: varchar("media_path", { length: 500 }),
    generatedImageUrl: varchar("generated_image_url", { length: 500 }),
    scheduledAt: timestamp("scheduled_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "string",
    }),
    status: poststatus().notNull(),
    platforms: json(),
    clientId: integer("client_id").notNull(),
    publishingResults: json("publishing_results"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count"),
    useGptContent: boolean("use_gpt_content"),
    useGptImage: boolean("use_gpt_image"),
    gptPrompt: text("gpt_prompt"),
    id: serial().primaryKey().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("ix_posts_id").using(
      "btree",
      table.id.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [clients.id],
      name: "posts_client_id_fkey",
    }),
  ],
);

export const channelCredentials = pgTable(
  "channel_credentials",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    accountId: uuid("account_id").notNull(),
    accessTokenEnc: text("access_token_enc").notNull(),
    refreshTokenEnc: text("refresh_token_enc"),
    tokenType: text("token_type"),
    scopes: text().array(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    meta: jsonb().default({}).notNull(),
    status: varchar({ length: 20 }).default("ok").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("channel_credentials_account_idx").using(
      "btree",
      table.accountId.asc().nullsLast().op("uuid_ops"),
    ),
  ],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: timestamp({ mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("verification_tokens_identifier_idx").using(
      "btree",
      table.identifier.asc().nullsLast().op("text_ops"),
    ),
    index("verification_tokens_token_idx").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops"),
    ),
    unique("verification_tokens_token_unique").on(table.token),
  ],
);

export const socialTokens = pgTable(
  "social_tokens",
  {
    platform: socialplatform().notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    tokenType: varchar("token_type", { length: 50 }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    scope: varchar({ length: 500 }),
    clientId: integer("client_id").notNull(),
    isActive: boolean("is_active"),
    lastRefreshedAt: timestamp("last_refreshed_at", {
      withTimezone: true,
      mode: "string",
    }),
    platformUserId: varchar("platform_user_id", { length: 255 }),
    platformUsername: varchar("platform_username", { length: 255 }),
    additionalData: text("additional_data"),
    id: serial().primaryKey().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("ix_social_tokens_id").using(
      "btree",
      table.id.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [clients.id],
      name: "social_tokens_client_id_fkey",
    }),
  ],
);

export const metrics = pgTable(
  "metrics",
  {
    date: date().notNull(),
    clientId: integer("client_id").notNull(),
    postsScheduled: integer("posts_scheduled"),
    postsPublished: integer("posts_published"),
    postsFailed: integer("posts_failed"),
    gptRequests: integer("gpt_requests"),
    gptTokensUsed: integer("gpt_tokens_used"),
    gptCost: doublePrecision("gpt_cost"),
    imagesGenerated: integer("images_generated"),
    imageGenerationCost: doublePrecision("image_generation_cost"),
    platformMetrics: json("platform_metrics"),
    averagePublishTime: doublePrecision("average_publish_time"),
    successRate: doublePrecision("success_rate"),
    totalCost: doublePrecision("total_cost"),
    costBreakdown: json("cost_breakdown"),
    id: serial().primaryKey().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("ix_metrics_id").using(
      "btree",
      table.id.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [clients.id],
      name: "metrics_client_id_fkey",
    }),
  ],
);

export const logs = pgTable(
  "logs",
  {
    level: loglevel().notNull(),
    message: text().notNull(),
    module: varchar({ length: 255 }),
    action: varchar({ length: 255 }),
    clientId: integer("client_id"),
    postId: integer("post_id"),
    extraData: json("extra_data"),
    exceptionTrace: text("exception_trace"),
    id: serial().primaryKey().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("ix_logs_id").using(
      "btree",
      table.id.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [clients.id],
      name: "logs_client_id_fkey",
    }),
    foreignKey({
      columns: [table.postId],
      foreignColumns: [posts.id],
      name: "logs_post_id_fkey",
    }),
  ],
);

export const tenantChannels = pgTable(
  "tenant_channels",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    channel: varchar({ length: 50 }).notNull(),
    enabled: boolean().default(true).notNull(),
    limitsPerDay: integer("limits_per_day").default(1).notNull(),
    postingWindow: jsonb("posting_window").default({}).notNull(),
    defaultHashtags: text("default_hashtags")
      .array()
      .default(["RAY"])
      .notNull(),
    policy: jsonb().default({}).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("tenant_channels_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
  ],
);

export const postingRules = pgTable(
  "posting_rules",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    channel: varchar({ length: 50 }).notNull(),
    frequency: text().notNull(),
    maxPerDay: integer("max_per_day").default(1).notNull(),
    priority: integer().default(0).notNull(),
    daysOff: integer("days_off").array().default([RAY]).notNull(),
    enabled: boolean().default(true).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("posting_rules_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
  ],
);

export const postJobs = pgTable(
  "post_jobs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    channel: varchar({ length: 50 }).notNull(),
    contentVariantId: uuid("content_variant_id").notNull(),
    accountId: uuid("account_id").notNull(),
    runAt: timestamp("run_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    status: varchar({ length: 20 }).default("queued").notNull(),
    attempts: integer().default(0).notNull(),
    lastError: text("last_error"),
    idempotencyKey: text("idempotency_key"),
    priority: integer().default(0).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("post_jobs_status_run_at_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
      table.runAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("post_jobs_tenant_status_run_at_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("timestamptz_ops"),
      table.status.asc().nullsLast().op("timestamptz_ops"),
      table.runAt.asc().nullsLast().op("timestamptz_ops"),
    ),
  ],
);

export const postResults = pgTable(
  "post_results",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    postJobId: uuid("post_job_id").notNull(),
    externalId: text("external_id"),
    permalink: text(),
    response: jsonb().default({}).notNull(),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("post_results_post_job_idx").using(
      "btree",
      table.postJobId.asc().nullsLast().op("uuid_ops"),
    ),
  ],
);

export const mediaRenditions = pgTable(
  "media_renditions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    mediaId: uuid("media_id").notNull(),
    preset: text().notNull(),
    url: text().notNull(),
    width: integer(),
    height: integer(),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("media_renditions_media_idx").using(
      "btree",
      table.mediaId.asc().nullsLast().op("uuid_ops"),
    ),
  ],
);

export const mercadopagoPayments = pgTable(
  "mercadopago_payments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    mpPaymentId: text("mp_payment_id").notNull(),
    status: varchar({ length: 20 }).notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    currency: varchar({ length: 3 }).default("MXN").notNull(),
    paymentMethod: varchar("payment_method", { length: 50 }),
    paymentMethodType: text("payment_method_type"),
    feesAmount: numeric("fees_amount", { precision: 10, scale: 2 }).default(
      "0",
    ),
    netAmount: numeric("net_amount", { precision: 10, scale: 2 }).notNull(),
    description: text(),
    payerInfo: jsonb("payer_info"),
    pointOfInteraction: jsonb("point_of_interaction"),
    externalReference: varchar("external_reference", { length: 100 }),
    dateCreated: timestamp("date_created", { mode: "string" }).notNull(),
    dateApproved: timestamp("date_approved", { mode: "string" }),
    orderId: uuid("order_id"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    mercadopagoPaymentId: varchar("mercadopago_payment_id", {
      length: 100,
    }).notNull(),
    paymentIntentId: varchar("payment_intent_id", { length: 100 }),
    metadata: jsonb(),
  },
  (table) => [
    pgPolicy("mp_payments_tenant_isolation", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(tenant_id = get_current_tenant_id())`,
    }),
  ],
);

export const posTerminals = pgTable(
  "pos_terminals",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    terminalId: varchar("terminal_id", { length: 100 }).notNull(),
    name: varchar({ length: 100 }).notNull(),
    location: varchar({ length: 200 }),
    status: varchar({ length: 20 }).default("active").notNull(),
    lastSync: timestamp("last_sync", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    metadata: jsonb(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    pgPolicy("pos_terminals_tenant_isolation", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(tenant_id = get_current_tenant_id())`,
    }),
  ],
);

export const financialMovements = pgTable(
  "financial_movements",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    type: varchar({ length: 50 }).notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    currency: text().default("MXN"),
    description: text(),
    referenceId: text("reference_id"),
    paymentMethod: varchar("payment_method", { length: 50 }),
    paymentMethodType: text("payment_method_type"),
    counterparty: text(),
    movementDate: date("movement_date").notNull(),
    reconciled: boolean().default(false),
    reconciliationId: uuid("reconciliation_id"),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    pgPolicy("financial_movements_tenant_isolation", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(tenant_id = get_current_tenant_id())`,
    }),
  ],
);

export const mercadopagoTokens = pgTable(
  "mercadopago_tokens",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    expiresIn: integer("expires_in").notNull(),
    tokenType: varchar("token_type", { length: 20 }).notNull(),
    scope: text(),
    merchantId: varchar("merchant_id", { length: 100 }),
    environment: varchar({ length: 10 }).default("production").notNull(),
    metadata: jsonb(),
  },
  (table) => [
    pgPolicy("mercadopago_tokens_tenant_isolation", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(tenant_id = get_current_tenant_id())`,
    }),
  ],
);

export const financialKpis = pgTable(
  "financial_kpis",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    date: date().notNull(),
    totalIncome: numeric("total_income", { precision: 12, scale: 2 }).notNull(),
    totalExpenses: numeric("total_expenses", {
      precision: 12,
      scale: 2,
    }).notNull(),
    netCashFlow: numeric("net_cash_flow", {
      precision: 12,
      scale: 2,
    }).notNull(),
    transactionCount: integer("transaction_count").notNull(),
    averageTicket: numeric("average_ticket", {
      precision: 10,
      scale: 2,
    }).notNull(),
    approvalRate: numeric("approval_rate", {
      precision: 5,
      scale: 2,
    }).notNull(),
    refundRate: numeric("refund_rate", { precision: 5, scale: 2 }).default("0"),
    chargebackRate: numeric("chargeback_rate", {
      precision: 5,
      scale: 2,
    }).default("0"),
    commissionAmount: numeric("commission_amount", {
      precision: 10,
      scale: 2,
    }).default("0"),
    availableBalance: numeric("available_balance", {
      precision: 12,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    pgPolicy("financial_kpis_tenant_isolation", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(tenant_id = get_current_tenant_id())`,
    }),
  ],
);

export const socialPostVariants = pgTable("social_post_variants", {
  id: uuid().primaryKey().notNull(),
  postId: uuid("post_id").notNull(),
  platform: varchar({ length: 10 }).notNull(),
  content: text().notNull(),
  mediaUrl: text("media_url"),
  mediaType: varchar("media_type", { length: 20 }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const tenantSocialPlatforms = pgTable("tenant_social_platforms", {
  id: uuid().primaryKey().notNull(),
  tenantId: uuid("tenant_id").notNull(),
  platform: varchar({ length: 10 }).notNull(),
  enabled: boolean().default(true),
  connected: boolean().default(false),
  dailyLimit: integer("daily_limit").default(1),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const socialContentLibrary = pgTable("social_content_library", {
  id: uuid().primaryKey().notNull(),
  tenantId: uuid("tenant_id").notNull(),
  title: varchar({ length: 255 }).notNull(),
  content: text().notNull(),
  mediaUrl: text("media_url"),
  category: varchar({ length: 50 }).default("general"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const customers = pgTable(
  "customers",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    name: varchar({ length: 200 }).notNull(),
    phone: varchar({ length: 20 }).notNull(),
    email: varchar({ length: 255 }),
    generalNotes: text("general_notes"),
    tags: text().array().default(["RAY"]),
    status: customerStatus().default("active").notNull(),
    metadata: jsonb().default({}),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    address: text(),
  },
  (table) => [
    index("customers_email_idx").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops"),
    ),
    index("customers_phone_idx").using(
      "btree",
      table.phone.asc().nullsLast().op("text_ops"),
    ),
    index("customers_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    index("customers_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    index("customers_tenant_phone_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("text_ops"),
      table.phone.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const visitPhotos = pgTable(
  "visit_photos",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    visitId: uuid("visit_id").notNull(),
    url: text().notNull(),
    type: visitPhotoType().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("visit_photos_visit_idx").using(
      "btree",
      table.visitId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.visitId],
      foreignColumns: [customerVisits.id],
      name: "visit_photos_visit_id_customer_visits_id_fk",
    }).onDelete("cascade"),
  ],
);

export const socialPostAnalytics = pgTable("social_post_analytics", {
  id: uuid().primaryKey().notNull(),
  postId: uuid("post_id").notNull(),
  platform: varchar({ length: 10 }).notNull(),
  metricDate: date("metric_date").notNull(),
  reach: integer().default(0),
  impressions: integer().default(0),
  engagement: integer().default(0),
  likes: integer().default(0),
  comments: integer().default(0),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const services = pgTable(
  "services",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    name: varchar({ length: 200 }).notNull(),
    description: text(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    duration: numeric({ precision: 4, scale: 1 }).notNull(),
    featured: boolean().default(false),
    active: boolean().default(true),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    beforeImage: text("before_image"),
    afterImage: text("after_image"),
    imageUrl: text("image_url"),
    videoUrl: text("video_url"),
    shortDescription: varchar("short_description", { length: 140 }),
    longDescription: text("long_description"),
  },
  (table) => [
    index("service_featured_idx").using(
      "btree",
      table.featured.asc().nullsLast().op("bool_ops"),
    ),
    index("service_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "services_tenant_id_tenants_id_fk",
    }),
  ],
);

export const tenantQuotas = pgTable(
  "tenant_quotas",
  {
    tenantId: uuid("tenant_id").primaryKey().notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storageUsedBytes: bigint("storage_used_bytes", { mode: "number" }).default(
      0,
    ),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    storageLimitBytes: bigint("storage_limit_bytes", {
      mode: "number",
    }).default(sql`'5368709120'`),
    mediaCount: integer("media_count").default(0),
    mediaLimit: integer("media_limit").default(1000),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    bandwidthUsedBytes: bigint("bandwidth_used_bytes", {
      mode: "number",
    }).default(0),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    bandwidthLimitBytes: bigint("bandwidth_limit_bytes", {
      mode: "number",
    }).default(sql`'53687091200'`),
    resetDate: date("reset_date").default(
      sql`(CURRENT_DATE + '30 days'::interval)`,
    ),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "tenant_quotas_tenant_id_tenants_id_fk",
    }),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    sku: varchar({ length: 50 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
    description: text(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    category: varchar({ length: 50 }).notNull(),
    featured: boolean().default(false),
    active: boolean().default(true),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    imageUrl: text("image_url"),
  },
  (table) => [
    index("product_category_idx").using(
      "btree",
      table.category.asc().nullsLast().op("text_ops"),
    ),
    index("product_featured_idx").using(
      "btree",
      table.featured.asc().nullsLast().op("bool_ops"),
    ),
    index("product_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    uniqueIndex("product_tenant_sku_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
      table.sku.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "products_tenant_id_tenants_id_fk",
    }),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id"),
    actorId: uuid("actor_id"),
    action: text().notNull(),
    targetTable: text("target_table"),
    targetId: uuid("target_id"),
    data: jsonb().default({}).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("audit_logs_action_idx").using(
      "btree",
      table.action.asc().nullsLast().op("text_ops"),
    ),
    index("audit_logs_created_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("audit_logs_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "audit_logs_tenant_id_tenants_id_fk",
    }),
  ],
);

export const staff = pgTable(
  "staff",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    name: varchar({ length: 100 }).notNull(),
    role: varchar({ length: 50 }).notNull(),
    email: varchar({ length: 255 }),
    phone: varchar({ length: 20 }),
    specialties: jsonb().default([]).notNull(),
    photo: text(),
    googleCalendarId: varchar("google_calendar_id", { length: 255 }),
    active: boolean().default(true),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("staff_email_idx").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops"),
    ),
    index("staff_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "staff_tenant_id_tenants_id_fk",
    }),
  ],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    key: varchar({ length: 64 }).notNull(),
    name: varchar({ length: 100 }).notNull(),
    prefix: varchar({ length: 16 }).notNull(),
    status: varchar({ length: 20 }).default("active").notNull(),
    permissions: jsonb().default([]).notNull(),
    lastUsedAt: timestamp("last_used_at", { mode: "string" }),
    expiresAt: timestamp("expires_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    uniqueIndex("api_key_key_idx").using(
      "btree",
      table.key.asc().nullsLast().op("text_ops"),
    ),
    index("api_key_prefix_idx").using(
      "btree",
      table.prefix.asc().nullsLast().op("text_ops"),
    ),
    index("api_key_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
    ),
    index("api_key_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "api_keys_tenant_id_tenants_id_fk",
    }),
    unique("api_keys_key_unique").on(table.key),
  ],
);

export const users = pgTable(
  "users",
  {
    id: text().primaryKey().notNull(),
    name: text(),
    email: text(),
    emailVerified: timestamp("email_verified", { mode: "string" }),
    image: text(),
    password: text(),
    phone: varchar({ length: 20 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    resetToken: text("reset_token"),
    resetTokenExpiry: timestamp("reset_token_expiry", { mode: "string" }),
  },
  (table) => [unique("users_email_unique").on(table.email)],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    serviceId: uuid("service_id").notNull(),
    staffId: uuid("staff_id"),
    customerName: varchar("customer_name", { length: 100 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
    customerPhone: varchar("customer_phone", { length: 20 }),
    startTime: timestamp("start_time", { mode: "string" }).notNull(),
    endTime: timestamp("end_time", { mode: "string" }).notNull(),
    status: varchar({ length: 20 }).default("pending").notNull(),
    notes: text(),
    totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
    googleEventId: varchar("google_event_id", { length: 255 }),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    customerId: uuid("customer_id"),
  },
  (table) => [
    index("booking_service_idx").using(
      "btree",
      table.serviceId.asc().nullsLast().op("uuid_ops"),
    ),
    index("booking_staff_idx").using(
      "btree",
      table.staffId.asc().nullsLast().op("uuid_ops"),
    ),
    index("booking_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
    ),
    index("booking_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    index("booking_time_idx").using(
      "btree",
      table.startTime.asc().nullsLast().op("timestamp_ops"),
    ),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: "bookings_customer_id_customers_id_fk",
    }),
    foreignKey({
      columns: [table.serviceId],
      foreignColumns: [services.id],
      name: "bookings_service_id_services_id_fk",
    }),
    foreignKey({
      columns: [table.staffId],
      foreignColumns: [staff.id],
      name: "bookings_staff_id_staff_id_fk",
    }),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "bookings_tenant_id_tenants_id_fk",
    }),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text().primaryKey().notNull(),
    sessionToken: text("session_token").notNull(),
    userId: text("user_id").notNull(),
    expires: timestamp({ mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("sessions_session_token_idx").using(
      "btree",
      table.sessionToken.asc().nullsLast().op("text_ops"),
    ),
    index("sessions_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "sessions_user_id_users_id_fk",
    }).onDelete("cascade"),
    unique("sessions_session_token_unique").on(table.sessionToken),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    orderNumber: varchar("order_number", { length: 100 }).notNull(),
    customerName: varchar("customer_name", { length: 100 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
    customerPhone: varchar("customer_phone", { length: 20 }),
    status: varchar({ length: 20 }).default("pending").notNull(),
    type: varchar({ length: 20 }).default("purchase").notNull(),
    total: numeric({ precision: 10, scale: 2 }).notNull(),
    currency: varchar({ length: 3 }).default("MXN").notNull(),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("order_created_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops"),
    ),
    uniqueIndex("order_number_idx").using(
      "btree",
      table.orderNumber.asc().nullsLast().op("text_ops"),
    ),
    index("order_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
    ),
    index("order_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "orders_tenant_id_tenants_id_fk",
    }),
    unique("orders_order_number_unique").on(table.orderNumber),
  ],
);

export const tenantConfigs = pgTable(
  "tenant_configs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    category: varchar({ length: 50 }).notNull(),
    key: varchar({ length: 50 }).notNull(),
    value: jsonb(),
    description: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    pgPolicy("tenant_configs_tenant_isolation", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(tenant_id = get_current_tenant_id())`,
    }),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderId: uuid("order_id").notNull(),
    tenantId: uuid("tenant_id").notNull(),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    currency: varchar({ length: 3 }).default("MXN").notNull(),
    status: varchar({ length: 20 }).default("pending").notNull(),
    paidAt: timestamp("paid_at", { mode: "string" }),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("payment_order_idx").using(
      "btree",
      table.orderId.asc().nullsLast().op("uuid_ops"),
    ),
    index("payment_stripe_idx").using(
      "btree",
      table.stripePaymentIntentId.asc().nullsLast().op("text_ops"),
    ),
    index("payment_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "payments_order_id_orders_id_fk",
    }),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "payments_tenant_id_tenants_id_fk",
    }),
  ],
);

export const productReviews = pgTable(
  "product_reviews",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    productId: uuid("product_id").notNull(),
    userId: text("user_id"),
    customerName: varchar("customer_name", { length: 100 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
    rating: integer().notNull(),
    title: varchar({ length: 200 }),
    comment: text(),
    verified: boolean().default(false),
    status: varchar({ length: 20 }).default("pending").notNull(),
    helpful: integer().default(0),
    reported: integer().default(0),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("review_created_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("review_product_idx").using(
      "btree",
      table.productId.asc().nullsLast().op("uuid_ops"),
    ),
    index("review_product_status_idx").using(
      "btree",
      table.productId.asc().nullsLast().op("uuid_ops"),
      table.status.asc().nullsLast().op("uuid_ops"),
    ),
    index("review_rating_idx").using(
      "btree",
      table.rating.asc().nullsLast().op("int4_ops"),
    ),
    index("review_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
    ),
    index("review_tenant_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
    ),
    index("review_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: "product_reviews_product_id_products_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "product_reviews_tenant_id_tenants_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "product_reviews_user_id_users_id_fk",
    }),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderId: uuid("order_id").notNull(),
    type: varchar({ length: 20 }).notNull(),
    name: varchar({ length: 200 }).notNull(),
    quantity: integer().notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("order_item_order_idx").using(
      "btree",
      table.orderId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: "order_items_order_id_orders_id_fk",
    }),
  ],
);

export const tenants = pgTable(
  "tenants",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    slug: varchar({ length: 50 }).notNull(),
    name: varchar({ length: 100 }).notNull(),
    description: text(),
    mode: varchar({ length: 20 }).default("catalog").notNull(),
    status: varchar({ length: 20 }).default("active").notNull(),
    branding: jsonb().notNull(),
    contact: jsonb().notNull(),
    location: jsonb().notNull(),
    quotas: jsonb().notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    timezone: varchar({ length: 50 }).default("America/Mexico_City").notNull(),
    googleCalendarId: varchar("google_calendar_id", { length: 255 }),
    googleCalendarTokens: jsonb("google_calendar_tokens"),
    googleCalendarConnected: boolean("google_calendar_connected")
      .default(false)
      .notNull(),
  },
  (table) => [
    uniqueIndex("tenant_slug_idx").using(
      "btree",
      table.slug.asc().nullsLast().op("text_ops"),
    ),
    index("tenant_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops"),
    ),
    unique("tenants_slug_unique").on(table.slug),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    type: text().notNull(),
    provider: text().notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text(),
    idToken: text("id_token"),
    sessionState: text("session_state"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("accounts_provider_account_id_idx").using(
      "btree",
      table.providerAccountId.asc().nullsLast().op("text_ops"),
    ),
    index("accounts_provider_idx").using(
      "btree",
      table.provider.asc().nullsLast().op("text_ops"),
    ),
    index("accounts_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "accounts_user_id_users_id_fk",
    }).onDelete("cascade"),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    assetType: varchar("asset_type", { length: 50 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }),
    filename: varchar({ length: 255 }).notNull(),
    contentHash: varchar("content_hash", { length: 64 }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    originalSize: bigint("original_size", { mode: "number" }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    totalSize: bigint("total_size", { mode: "number" }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    width: integer(),
    height: integer(),
    dominantColor: varchar("dominant_color", { length: 7 }),
    blurhash: varchar({ length: 255 }),
    variants: jsonb().notNull(),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("media_entity_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("text_ops"),
      table.entityId.asc().nullsLast().op("uuid_ops"),
    ),
    uniqueIndex("media_hash_idx").using(
      "btree",
      table.contentHash.asc().nullsLast().op("text_ops"),
    ),
    index("media_tenant_type_idx").using(
      "btree",
      table.tenantId.asc().nullsLast().op("uuid_ops"),
      table.assetType.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "media_assets_tenant_id_tenants_id_fk",
    }),
    unique("media_assets_content_hash_unique").on(table.contentHash),
  ],
);

export const socialPosts = pgTable(
  "social_posts",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    title: text(),
    baseText: text("base_text").notNull(),
    status: varchar({ length: 20 }).default("draft").notNull(),
    scheduledAtUtc: timestamp("scheduled_at_utc", {
      withTimezone: true,
      mode: "string",
    }),
    timezone: varchar({ length: 50 }).default("UTC").notNull(),
    createdBy: varchar("created_by", { length: 255 }),
    updatedBy: varchar("updated_by", { length: 255 }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    bodyMd: text("body_md"),
    mediaIds: uuid("media_ids").array().default(["RAY"]).notNull(),
    tags: text().array().default(["RAY"]).notNull(),
    dueDate: date("due_date"),
  },
  (table) => [
    foreignKey({
      columns: [table.tenantId],
      foreignColumns: [tenants.id],
      name: "social_posts_tenant_id_tenants_id_fk",
    }),
  ],
);
