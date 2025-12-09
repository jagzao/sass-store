import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db/connection';
import { seedTenantData } from '../../../lib/db/seed-data';
import { tenants } from '../../../../packages/database/schema';

export async function GET(request: NextRequest) {
  try {
    // Verificar si es un entorno de producción
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        { error: 'This endpoint is for production use only' },
        { status: 403 }
      );
    }

    // Verificar si hay un token de autorización para prevenir ejecuciones no autorizadas
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.VERCEL_SEED_TOKEN;
    
    if (!expectedToken) {
      return NextResponse.json(
        { error: 'VERCEL_SEED_TOKEN not configured' },
        { status: 500 }
      );
    }
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar si ya hay datos en la base de datos
    const existingTenants = await db.select().from(tenants);
    
    if (existingTenants.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Database already seeded',
        data: { tenantCount: existingTenants.length }
      });
    }
    
    // Si no hay datos, ejecutar el seed
    const result = await seedTenantData();
    
    return NextResponse.json({
      success: true,
      message: 'Production database seeded successfully',
      data: result
    });
  } catch (error) {
    console.error('Error seeding production database:', error);
    return NextResponse.json(
      { error: 'Failed to seed production database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}