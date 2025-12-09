import { NextRequest, NextResponse } from 'next/server';
import { db } from '@sass-store/database';
import { tenants } from '@sass-store/database/schema';

export async function GET(request: NextRequest) {
  try {
    // Verificar si hay un token de autorización para prevenir ejecuciones no autorizadas
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SEED_API_TOKEN || 'dev-seed-token';

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
        data: { tenantCount: existingTenants.length, tenants: existingTenants }
      });
    }

    // Si no hay datos, crear el tenant WonderNails
    const [newTenant] = await db.insert(tenants).values({
      slug: 'wondernails',
      name: 'Wonder Nails',
      description: 'Salón de uñas premium',
      mode: 'booking',
      status: 'active',
      timezone: 'America/Mexico_City',
      branding: {
        primaryColor: '#D4AF37',
        secondaryColor: '#000000',
        logo: '',
        favicon: ''
      },
      contact: {
        phone: '+52 555 123 4567',
        email: 'contacto@wondernails.mx',
        whatsapp: '+525551234567'
      },
      location: {
        address: 'Av. Principal 123',
        city: 'Ciudad de México',
        state: 'CDMX',
        country: 'México',
        postalCode: '01000'
      },
      quotas: {
        maxProducts: 100,
        maxServices: 50,
        maxStaff: 10
      }
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'Production database seeded successfully',
      data: { tenant: newTenant }
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