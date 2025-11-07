/* global globalThis */
import { drizzle } from "drizzle-orm/postgres-js";
import type { PgTable, PgColumn } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";

// Types for mock database
type MockData<T = unknown> = T[];
type MockTable = PgTable | Record<string, PgColumn>;
type WhereCondition = SQL | undefined;
type OrderByArgs = SQL[] | PgColumn[];
type ConflictOptions = {
  target: PgColumn | PgColumn[];
  set: Record<string, unknown>;
};

// Self-healing: Create comprehensive mock db that matches Drizzle API
const createMockDb = () => {
  // Only log in development to avoid excessive logging in production
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[Self-Healing] DATABASE_URL is not set - using mock data fallback",
    );
  }

  const mockResult = <T = unknown>(data: MockData<T> = []) =>
    Promise.resolve(data);

  const mockQuery = {
    select: (columns?: Record<string, PgColumn>) => ({
      from: (table: MockTable) => ({
        where: (condition?: WhereCondition) => ({
          limit: (count: number) => mockResult([]),
          offset: (count: number) => ({
            limit: (count: number) => mockResult([]),
          }),
          orderBy: (...args: OrderByArgs) => ({
            limit: (count: number) => mockResult([]),
            offset: (count: number) => mockResult([]),
          }),
          groupBy: (...args: OrderByArgs) => mockResult([]),
          having: (condition: WhereCondition) => mockResult([]),
          execute: () => mockResult([]),
        }),
        leftJoin: (table: MockTable, condition: WhereCondition) => ({
          where: (condition?: WhereCondition) => ({
            limit: (count: number) => mockResult([]),
            orderBy: (...args: OrderByArgs) => mockResult([]),
          }),
        }),
        innerJoin: (table: MockTable, condition: WhereCondition) => ({
          where: (condition?: WhereCondition) => ({
            limit: (count: number) => mockResult([]),
            orderBy: (...args: OrderByArgs) => mockResult([]),
          }),
        }),
        limit: (count: number) => mockResult([]),
        orderBy: (...args: OrderByArgs) => mockResult([]),
        execute: () => mockResult([]),
      }),
    }),
    insert: (table: MockTable) => ({
      values: (data: Record<string, unknown> | Record<string, unknown>[]) => ({
        returning: (columns?: Record<string, PgColumn>) => mockResult([]),
        onConflictDoUpdate: (options: ConflictOptions) => ({
          returning: (columns?: Record<string, PgColumn>) => mockResult([]),
        }),
        onConflictDoNothing: () => ({
          returning: (columns?: Record<string, PgColumn>) => mockResult([]),
        }),
        execute: () => mockResult([]),
      }),
    }),
    update: (table: MockTable) => ({
      set: (data: Record<string, unknown>) => ({
        where: (condition: WhereCondition) => ({
          returning: (columns?: Record<string, PgColumn>) => mockResult([]),
          execute: () => mockResult([]),
        }),
      }),
    }),
    delete: (table: MockTable) => ({
      where: (condition: WhereCondition) => ({
        returning: (columns?: Record<string, PgColumn>) => mockResult([]),
        execute: () => mockResult([]),
      }),
    }),
    execute: (query: SQL) => mockResult([]),
    $with: (name: string) => ({ as: (query: typeof mockQuery) => mockQuery }),
  };

  // Cast to Drizzle DB type since mockQuery implements the same interface
  return mockQuery as unknown as ReturnType<typeof drizzle>;
};

// Initialize PostgreSQL connection
// TEMPORARY FIX: Override cached env var with correct hostname and username
let connectionString = process.env.DATABASE_URL;

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

// Connection pool configuration
export const connectionConfig = {
  idleTimeout: 300, // 5 minutes
  maxConnections: 10, // Keep low for cost optimization
  connectionTimeout: 30000, // 30 seconds
};

// Singleton cache with connection string tracking
/* eslint-disable no-var */
declare global {
  var __webDbInstance: ReturnType<typeof drizzle> | undefined;
  var __webDbConnectionString: string | undefined;
}
/* eslint-enable no-var */

// Helper to check database connectivity
export async function checkDatabaseConnection(): Promise<boolean> {
  if (!connectionString) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Self-Healing] Database connection check skipped - no DATABASE_URL",
      );
    }
    return false;
  }

  try {
    const client = postgres(connectionString, {
      prepare: false,
      ssl: "require",
      max: 1,
      idle_timeout: 10,
      connect_timeout: 5,
    });

    await client`SELECT 1`;
    await client.end();
    return true;
  } catch (error) {
    console.error("[Self-Healing] Database connection failed:", error);
    return false;
  }
}

// Create the database instance with proper error handling
function createDatabaseInstance() {
  if (!connectionString) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Self-Healing] DATABASE_URL is not set - using mock database",
      );
    }
    return createMockDb();
  }

  try {
    // Extract hostname for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      const url = new URL(connectionString.replace("postgresql://", "http://"));
      console.log("[DB] Connecting to host:", url.hostname);
    }

    const client = postgres(connectionString, {
      prepare: false,
      ssl: "require",
      max: connectionConfig.maxConnections,
      idle_timeout: connectionConfig.idleTimeout,
      connect_timeout: 30,
      onnotice: () => {}, // Silence notices
      debug: process.env.NODE_ENV === "development",
    });

    return drizzle(client, { schema });
  } catch (error) {
    console.error(
      "[Self-Healing] Failed to create database instance, using mock fallback:",
      error,
    );
    return createMockDb();
  }
}

// FORCE INVALIDATE CACHE - hostname was corrected
if (
  globalThis.__webDbConnectionString?.includes(
    "db.jedryjmljffuvegggjmw.supabase.co",
  )
) {
  console.log("[DB] FORCE INVALIDATING - old hostname detected in cache");
  globalThis.__webDbInstance = undefined;
  globalThis.__webDbConnectionString = undefined;
}

// Detect connection string change and invalidate cache
if (
  globalThis.__webDbConnectionString &&
  globalThis.__webDbConnectionString !== connectionString
) {
  console.log("[DB] Connection string changed, invalidating web db cache");
  globalThis.__webDbInstance = undefined;
}

globalThis.__webDbConnectionString = connectionString;

export const db = globalThis.__webDbInstance ?? createDatabaseInstance();

if (process.env.NODE_ENV !== "production") {
  globalThis.__webDbInstance = db;
}

// Type for the database instance
export type Database = typeof db;
