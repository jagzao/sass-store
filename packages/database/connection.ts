import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Initialize PostgreSQL connection
let connectionString = process.env.DATABASE_URL!;

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
  var __db: Database | undefined;

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
export type Database = ReturnType<typeof drizzle<typeof schema>>;

// Helper to determine if we're in a test environment
const isTestEnv = process.env.NODE_ENV === "test";
const isLocalhost =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

/**
 * Supabase, Neon, RDS, etc. require TLS even when NODE_ENV is development.
 * Only skip TLS for real loopback hosts (or explicit sslmode=disable).
 */
function inferSslForConnectionString(urlStr: string): false | "require" {
  const trimmed = urlStr.trim();
  if (!trimmed) {
    return "require";
  }

  try {
    const parsed = new URL(trimmed.replace(/^postgres(ql)?:/i, "http:"));
    const host = parsed.hostname.toLowerCase();
    const sslmode = parsed.searchParams.get("sslmode")?.toLowerCase();
    if (sslmode === "disable") {
      return false;
    }
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local")
    ) {
      return false;
    }
    return "require";
  } catch {
    return "require";
  }
}

// Helper function to safely get connection string
function getConnectionString(): string {
  // Use separate env var for testing if available to avoid wiping dev data
  if (isTestEnv && process.env.TEST_DATABASE_URL) {
    console.log("[DB] Using TEST_DATABASE_URL");
    return process.env.TEST_DATABASE_URL;
  }
  console.log("[DB] Using DATABASE_URL");
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

  const useSsl = inferSslForConnectionString(connectionString);

  _client = postgres(connectionString, {
    prepare: false,
    ssl: useSsl,
    // Optimized for Serverless:
    // E2E mode needs higher max to avoid pool exhaustion during warmup
    max:
      process.env.E2E_SEED_ENABLED === "true"
        ? 10
        : isTestEnv
          ? 15
          : isLocalhost
            ? 10
            : 1, // Strict limit for production serverless
    idle_timeout: process.env.E2E_SEED_ENABLED === "true" ? 30 : 10, // Keep connections alive longer in E2E
    connect_timeout: process.env.E2E_SEED_ENABLED === "true" ? 15 : 5, // Fail fast (5s) to avoid 10s wait
    max_lifetime: process.env.E2E_SEED_ENABLED === "true" ? 60 * 30 : 60 * 5, // 30 min max life in E2E
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

// Store connection string globally (same source as getClient(), not module bootstrap default)
globalThis.__connectionString = getConnectionString() || connectionString;

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
    ssl: inferSslForConnectionString(url),
    maxConnections: isTestEnv ? 15 : isLocalhost ? 10 : 1,
  };
}
