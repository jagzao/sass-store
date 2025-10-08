import type { Config } from 'drizzle-kit';

export default {
  schema: './packages/database/schema.ts',
  out: './packages/database/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;