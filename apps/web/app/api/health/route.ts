import { NextApiRequest, NextApiResponse } from 'next';

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  services: {
    database: boolean;
    cache: boolean;
    externalAPIs: boolean;
  };
  version?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Perform health checks on critical services
    const healthCheck: HealthCheckResponse = {
      status: 'healthy', // We'll set this based on actual checks
      timestamp: new Date(),
      uptime: process.uptime(),
      services: {
        database: await checkDatabaseConnection(),
        cache: await checkCacheConnection(),
        externalAPIs: await checkExternalAPIs()
      },
      version: process.env.npm_package_version
    };

    // Determine overall status based on service statuses
    if (!healthCheck.services.database || !healthCheck.services.cache) {
      healthCheck.status = 'unhealthy';
    }

    const status = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(status).json(healthCheck);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      services: {
        database: false,
        cache: false,
        externalAPIs: false
      },
      version: process.env.npm_package_version
    });
  }
}

async function checkDatabaseConnection(): Promise<boolean> {
  // In a real implementation, this would check the actual database connection
  try {
    // This is a placeholder - would connect to your database in reality
    // For now, return true to simulate healthy connection
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

async function checkCacheConnection(): Promise<boolean> {
  // In a real implementation, this would check the cache connection
  try {
    // This is a placeholder - would connect to Redis/Upstash in reality
    return true;
  } catch (error) {
    console.error('Cache health check failed:', error);
    return false;
  }
}

async function checkExternalAPIs(): Promise<boolean> {
  // In a real implementation, this would check connections to external services
  try {
    // Check if critical services are reachable
    return true;
  } catch (error) {
    console.error('External API health check failed:', error);
    return false;
  }
}