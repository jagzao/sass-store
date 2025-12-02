import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Initialize PostgreSQL connection
// TEMPORARY FIX: Override cached env var with correct hostname and username
let connectionString = process.env.DATABASE_URL!;

if (connectionString?.includes("db.jedryjmljffuvegggjmw.supabase.co")) {
  // Fix hostname
  connectionString = connectionString.replace(
    "db.jedryjmljffuvegggjmw.supabase.co",
    "aws-1-us-east-2.pooler.supabase.com",
  );
  // Fix username for pooler (needs to be postgres.PROJECT_ID)
  if (!connectionString.includes("postgres.jedryjmljffuvegggjmw")) {
    connectionString = connectionString.replace(
      "postgresql://postgres:",
      "postgresql://postgres.jedryjmljffuvegggjmw:",
    );
  }
}

if (!connectionString || connectionString === "your-database-url-here") {
  console.warn(
    "[DB] DATABASE_URL is not properly configured, using mock connection",
  );
  // Use a dummy connection string that won't connect but won't crash
  connectionString = "postgresql://user:password@localhost:5432/dummy";
}

// Singleton pattern to prevent connection pool exhaustion
// CRITICAL: Supabase free tier has only 3-5 connection limit
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle> | undefined;
  // eslint-disable-next-line no-var
  var __client: postgres.Sql | undefined;
  // eslint-disable-next-line no-var
  var __connectionString: string | undefined;
}

// Detect if connection string changed and invalidate cache
if (
  globalThis.__connectionString &&
  globalThis.__connectionString !== connectionString
) {
  console.log("[DB] Connection string changed, invalidating cache");
  globalThis.__client?.end({ timeout: 0 });
  globalThis.__client = undefined;
  globalThis.__db = undefined;
}

globalThis.__connectionString = connectionString;

// FORCE INVALIDATE CACHE - hostname was corrected
if (
  globalThis.__connectionString?.includes("db.jedryjmljffuvegggjmw.supabase.co")
) {
  console.log("[DB] FORCE INVALIDATING - old hostname detected in cache");
  globalThis.__client?.end({ timeout: 0 });
  globalThis.__client = undefined;
  globalThis.__db = undefined;
  globalThis.__connectionString = connectionString;
}

// Determine if this is a local or remote connection
const isLocalhost =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

// Determine if we're in test environment (higher concurrency needs)
const isTestEnv = process.env.NODE_ENV === "test" || process.env.CI === "true";

// Create postgres client with optimized settings for concurrent load
const client =
  globalThis.__client ??
  postgres(connectionString, {
    prepare: false,
    ssl: isLocalhost ? false : "require", // Only use SSL for remote connections
    // Increased connection pool for test environments (8 parallel workers)
    // For production: 3-5 connections per instance to stay within Supabase limits
    max: isTestEnv ? 15 : isLocalhost ? 10 : 5,
    idle_timeout: 20, // 20 seconds - faster cleanup for test environments
    connect_timeout: 30, // 30 seconds - allow time for pooler connection
    max_lifetime: isTestEnv ? 60 * 15 : 60 * 45, // Shorter lifetime in tests (15 min vs 45 min)
    // Additional optimizations
    keep_alive: 60, // Keep connection alive every 60 seconds
    fetch_types: false, // Disable automatic type fetching for better performance
    // Connection pooling behavior
    connection: {
      application_name: `sass-store-${process.env.NODE_ENV || "dev"}`,
    },
  });

// Store client globally in development to prevent hot reload issues
if (process.env.NODE_ENV !== "production") {
  globalThis.__client = client;
}

// Create drizzle instance with schema
const dbInstance = drizzle(client, { schema });

// Export with explicit type to help TypeScript inference
export const db = (globalThis.__db ?? dbInstance) as typeof dbInstance;

// Store db globally in development
if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}

// Connection pool configuration for optimal cost management
export const connectionConfig = {
  idleTimeout: 300, // 5 minutes
  maxConnections: 10, // Keep low for cost optimization
  connectionTimeout: 30000, // 30 seconds
};

// Helper to check database connectivity
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// Type for the database instance
export type Database = typeof db;
