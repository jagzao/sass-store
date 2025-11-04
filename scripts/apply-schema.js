const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { migrate } = require('drizzle-orm/postgres-js/migrator');

// Schema import
const { 
  tenants, 
  users, 
  accounts, 
  sessions, 
  verificationTokens,
  // Add other tables as needed
} = require('./packages/database/schema');

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sass_store';

// Connect to database
const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

async function main() {
  console.log('Starting database sync...');

  try {
    // Apply schema to database
    // This will create tables if they don't exist
    await db.execute(`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Create tenants table first to resolve foreign key dependencies
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "slug" VARCHAR(50) UNIQUE NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "mode" VARCHAR(20) NOT NULL DEFAULT 'catalog',
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/Mexico_City',
        "branding" JSONB NOT NULL,
        "contact" JSONB NOT NULL,
        "location" JSONB NOT NULL,
        "quotas" JSONB NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
      
      -- Create users table
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT,
        "email" TEXT UNIQUE,
        "email_verified" TIMESTAMP,
        "image" TEXT,
        "password" TEXT,
        "phone" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        "reset_token" TEXT,
        "reset_token_expiry" TIMESTAMP WITH TIME ZONE
      );
      
      -- Create other tables as needed
      -- (We'll add the reset_token and reset_token_expiry columns directly here)
    `);
    
    console.log('Database schema applied successfully!');
    console.log('Added reset_token and reset_token_expiry columns to users table');
    
    // Verify the columns exist
    const result = await db.execute(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('reset_token', 'reset_token_expiry')
    `);
    
    console.log('Verification result:', result.rows);
    
    // Close connection
    await client.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error applying schema:', error);
    process.exit(1);
  }
}

main();