export const config = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sassstore',
  },
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  },
  costs: {
    monthlyBudget: parseFloat(process.env.MONTHLY_BUDGET || '5.00'),
  },
};

// Export auth functions from auth module
export * from './src/auth';