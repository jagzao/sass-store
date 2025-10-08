import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Initialize PostgreSQL connection
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Singleton pattern to prevent connection pool exhaustion
// CRITICAL: Supabase free tier has only 3-5 connection limit
declare global {
  var __db: ReturnType<typeof drizzle> | undefined;
  var __client: postgres.Sql | undefined;
}

// Create postgres client with optimized settings for Supabase
const client = globalThis.__client ?? postgres(connectionString, {
  prepare: false,
  ssl: 'require', // Supabase requires SSL
  max: 1, // CRITICAL: Keep at 1 for free tier to prevent exhaustion
  idle_timeout: 20, // 20 seconds - aggressive cleanup
  connect_timeout: 10, // 10 seconds
  max_lifetime: 60 * 30, // 30 minutes max connection lifetime
});

// Store client globally in development to prevent hot reload issues
if (process.env.NODE_ENV !== 'production') {
  globalThis.__client = client;
}

// Create drizzle instance with schema
export const db = globalThis.__db ?? drizzle(client, { schema });

// Store db globally in development
if (process.env.NODE_ENV !== 'production') {
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
    console.error('Database connection failed:', error);
    return false;
  }
}

// Type for the database instance
export type Database = typeof db;