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
  var __db: ReturnType<typeof drizzle> | undefined;

  var __client: postgres.Sql | undefined;

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
    // For production: 1 connection per instance to stay strictly within Supabase limits
    // CRITICAL: Serverless functions spin up many instances; high max here causes pool exhaustion immediately.
    max: isTestEnv ? 15 : isLocalhost ? 10 : 1,
    idle_timeout: 15, // 15 seconds - release connections quickly
    connect_timeout: 10, // 10 seconds - fail fast if pooler is overloaded
    max_lifetime: isTestEnv ? 60 * 15 : 60 * 5, // Recycle connections often in production (5 mins)
    // Additional optimizations
    keep_alive: null, // Disable keep-alive to allow serverless freeze
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

// Log connection attempt (masked)
const maskedUrl = connectionString?.replace(/:[^:@]*@/, ":****@");
console.log(
  `[DB] Initialize postgres client. URL: ${maskedUrl}, Max: ${isTestEnv ? 15 : isLocalhost ? 10 : 1}, SSL: ${isLocalhost ? false : "require"}`,
);

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

// Helper to get debug info about the connection (safe for public display)
export function getDatabaseDebugInfo() {
  const url = globalThis.__connectionString || process.env.DATABASE_URL || "";
  const isSupabase = url.includes("supabase");
  const isPooler = url.includes("pooler") || url.includes("supavisor");

  // Mask the password
  const maskedUrl = url.replace(/:[^:@]*@/, ":****@");

  return {
    isSupabase,
    isPooler,
    maskedUrl,
    ssl: isLocalhost ? false : "require",
    maxConnections: isTestEnv ? 15 : isLocalhost ? 10 : 1,
  };
}
