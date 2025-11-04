import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@sass-store/database';
import { users, tenants } from '@sass-store/database/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { assertTenantAccess, TenantAccessError } from '@/lib/auth/api-auth';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
  tenantSlug: z.string(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const passwordData = changePasswordSchema.parse(body);

    // Assert that the user has access to this tenant
    assertTenantAccess(session, passwordData.tenantSlug);

    // Get tenant ID from slug
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, passwordData.tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const tenantId = tenant.id;

    // Get current user with password
    const [currentUser] = await db
      .select({
        id: users.id,
        password: users.password,
      })
      .from(users)
      .where(and(eq(users.id, session.user.id), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    if (currentUser.password) {
      const passwordMatch = await bcrypt.compare(
        passwordData.currentPassword,
        currentUser.password
      );

      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Contraseña actual incorrecta' },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(passwordData.newPassword, 12);

    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, session.user.id), eq(users.tenantId, tenantId)));

    return NextResponse.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password PUT error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof TenantAccessError) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
