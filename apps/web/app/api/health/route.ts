import { NextResponse } from 'next/server';
import { healthMonitor } from '@/lib/self-healing/health-monitor';

// Health check endpoint for self-healing system
export async function GET() {
  try {
    const healthResult = await healthMonitor.performHealthCheck();

    const response = {
      status: healthResult.overall ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: healthResult.details,
      healingAttempts: healthResult.healingAttempts,
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(response, {
      status: healthResult.overall ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[Health Check] Failed:', error);

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown health check error',
      services: {
        database: false,
        api: false,
        storage: false
      }
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

export const dynamic = 'force-dynamic';