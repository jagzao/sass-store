import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Initialize PostgreSQL connection
// TEMPORARY FIX: Override cached env var with correct hostname and username
let connectionString = process.env.DATABASE_URL!;

if (connectionString?.includes("db.jedryjmljffuvegggjmw.supabase.co")) {
  // Fix hostname - use pooler without pgbouncer for optimal performance
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
  // Remove pgbouncer parameter for optimal performance (583ms vs 590ms)
  connectionString = connectionString.replace("?pgbouncer=true", "");
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

// Types
export type Database = ReturnType<typeof drizzle>;

// Helper to determine if we're in a test environment
const isTestEnv = process.env.NODE_ENV === "test";
const isLocalhost =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

// Helper function to safely get connection string
function getConnectionString(): string {
  // Use separate env var for testing if available to avoid wiping dev data
  if (isTestEnv && process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }
  return process.env.DATABASE_URL || "";
}

/**
 * Lazy Database Client Wrapper
 * Prevents connection initialization at module load time.
 * This is CRITICAL for Serverless environments to avoid "Function Timeout"
 * caused by hanging connections during cold start.
 */
let _client: postgres.Sql | null = null;
let _db: Database | null = null;

function getClient() {
  if (_client) return _client;

  // Use global cache for hot-reloading in dev
  if (globalThis.__client) {
    _client = globalThis.__client;
    return _client;
  }

  const connectionString = getConnectionString();

  if (!connectionString) {
    console.error("❌ DATABASE_URL is not defined!");
    // Return a dummy client to prevent crash on import, but will fail on query
    // This allows the app to at least start up and show a graphical error
    return postgres("postgres://invalid:invalid@localhost:5432/invalid");
  }

  console.log(`🔌 Initializing Lazy DB Connection...`);

  _client = postgres(connectionString, {
    prepare: false,
    ssl: isLocalhost ? false : "require", // Only use SSL for remote connections
    // Optimized for Serverless:
    max: isTestEnv ? 15 : isLocalhost ? 10 : 1, // Strict limit for production
    idle_timeout: 10, // Close idle connections faster
    connect_timeout: 5, // Fail fast (5s) to avoid 10s wait
    max_lifetime: 60 * 5, // 5 minutes max life
    keep_alive: null, // Allow serverless freeze
    fetch_types: false, // Performance
    connection: {
      application_name: `sass-store-${process.env.NODE_ENV || "prod"}`,
    },
  });

  // Store client globally for hot-reloading in dev
  if (process.env.NODE_ENV !== "production") {
    globalThis.__client = _client;
  }

  return _client;
}

// Initialize database instance
function getDb() {
  if (_db) return _db;

  // Use global cache for hot-reloading in dev
  if (globalThis.__db) {
    _db = globalThis.__db;
    return _db;
  }

  const client = getClient();
  _db = drizzle(client, { schema });

  // Store db globally for hot-reloading in dev
  if (process.env.NODE_ENV !== "production") {
    globalThis.__db = _db;
  }

  return _db;
}

export const db = getDb();

// Store connection string globally
globalThis.__connectionString = connectionString;

// Connection pool configuration for optimal cost management
export const connectionConfig = {
  idleTimeout: 300, // 5 minutes
  maxConnections: 10, // Keep low for cost optimization
  connectionTimeout: 30000, // 30 seconds
};

// Helper to check database connectivity
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = getClient();
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

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
