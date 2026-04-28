// @ts-nocheck
import { drizzle } from "drizzle-orm";
import { migrate } from "drizzle-orm/pg-core";
import { db } from "@sass-store/database";
import {
  videoProcessingJobs,
  videoProcessingAssets,
} from "@sass-store/database/video-processing-schema";

async function main() {
  console.log("🔄 Starting video processing database migration...");

  try {
    // Run migration
    const migration = await migrate(
      db,
      {
        videoProcessingJobs,
        videoProcessingAssets,
      },
      { migrationsFolder: "./migrations" }
    );

    console.log("✅ Video processing migration completed successfully");
    console.log(`📊 Migration summary: ${migration.summary}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
