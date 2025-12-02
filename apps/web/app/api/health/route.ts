import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: Date;
  uptime: number;
  services: {
    database: boolean;
    cache: boolean;
    externalAPIs: boolean;
  };
  version?: string;
}

export async function GET() {
  try {
    // Perform health checks on critical services
    const healthCheck: HealthCheckResponse = {
      status: "healthy", // We'll set this based on actual checks
      timestamp: new Date(),
      uptime: process.uptime(),
      services: {
        database: await checkDatabaseConnection(),
        cache: await checkCacheConnection(),
        externalAPIs: await checkExternalAPIs(),
      },
      version: process.env.npm_package_version,
    };

    // Determine overall status based on service statuses
    if (!healthCheck.services.database || !healthCheck.services.cache) {
      healthCheck.status = "unhealthy";
    }

    const status = healthCheck.status === "healthy" ? 200 : 503;
    return NextResponse.json(healthCheck, { status });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date(),
        uptime: process.uptime(),
        services: {
          database: false,
          cache: false,
          externalAPIs: false,
        },
        version: process.env.npm_package_version,
      },
      { status: 503 },
    );
  }
}

async function checkDatabaseConnection(): Promise<boolean> {
  // In a real implementation, this would check the actual database connection
  // This is a placeholder - would connect to your database in reality
  // For now, return true to simulate healthy connection
  return true;
}

async function checkCacheConnection(): Promise<boolean> {
  // In a real implementation, this would check the cache connection
  // This is a placeholder - would connect to Redis/Upstash in reality
  return true;
}

async function checkExternalAPIs(): Promise<boolean> {
  // In a real implementation, this would check connections to external services
  // Check if critical services are reachable
  return true;
}
