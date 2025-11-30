import {
  pgTable,
  text,
  integer,
  decimal,
  timestamp,
  uuid,
  jsonb,
  boolean,
  varchar,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./schema";

// Video Processing Jobs table
export const videoProcessingJobs = pgTable(
  "video_processing_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending' | 'processing' | 'completed' | 'failed'
    priority: integer("priority").notNull().default(0),

    // Input parameters
    imageIds: uuid("image_ids").array().notNull(),
    audioFile: text("audio_file"),
    textOverlay: text("text_overlay"),
    overlayType: varchar("overlay_type", { length: 50 }).default(
      "golden-frame"
    ),

    // Processing configuration
    durationTarget: decimal("duration_target", { precision: 10, scale: 2 }),
    qualityMode: varchar("quality_mode", { length: 20 }).default("normal"), // 'normal' | 'eco' | 'freeze'

    // Processing metadata
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    processingTimeMs: integer("processing_time_ms"),
    attempts: integer("attempts").default(0),
    maxAttempts: integer("max_attempts").default(3),
    lastError: text("last_error"),

    // Output
    outputVideoUrl: text("output_video_url"),
    outputThumbnailUrl: text("output_thumbnail_url"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("video_jobs_tenant_idx").on(table.tenantId),
    statusIdx: index("video_jobs_status_idx").on(table.status),
    priorityIdx: index("video_jobs_priority_idx").on(table.priority),
    createdIdx: index("video_jobs_created_idx").on(table.createdAt),
  })
);

// Video Processing Assets table
export const videoProcessingAssets = pgTable(
  "video_processing_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    assetType: varchar("asset_type", { length: 50 }).notNull(), // 'overlay' | 'frame' | 'audio'
    name: varchar("name", { length: 100 }).notNull(),
    filePath: text("file_path").notNull(),
    metadata: jsonb("metadata").default("{}"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdx: index("video_assets_tenant_idx").on(table.tenantId),
    assetTypeIdx: index("video_assets_asset_type_idx").on(table.assetType),
  })
);

// Relations
export const videoProcessingJobsRelations = relations(
  videoProcessingJobs,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [videoProcessingJobs.tenantId],
      references: [tenants.id],
    }),
  })
);

export const videoProcessingAssetsRelations = relations(
  videoProcessingAssets,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [videoProcessingAssets.tenantId],
      references: [tenants.id],
    }),
  })
);

// Add video processing relations to existing tenants relations
export const tenantsVideoProcessingRelations = relations(
  tenants,
  ({ many }) => ({
    videoProcessingJobs: many(videoProcessingJobs),
    videoProcessingAssets: many(videoProcessingAssets),
  })
);
