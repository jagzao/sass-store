import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  db,
  tenants,
  users,
  userRoles,
  products,
  services,
} from "@sass-store/database";
import { eq, ilike, or, count, sql, asc, desc } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Schema para validación de creación/edición de tenants
const tenantSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  slug: z
    .string()
    .min(1, "El slug es requerido")
    .max(50, "El slug no puede exceder 50 caracteres")
    .regex(
      /^[a-z0-9-]+$/,
      "El slug solo puede contener letras minúsculas, números y guiones",
    ),
  description: z.string().optional(),
  mode: z.enum(["booking", "ecommerce", "both"]).default("booking"),
  isActive: z.boolean().default(true),
  contactEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().default("MXN"),
  timezone: z.string().default("America/Mexico_City"),
  language: z.string().default("es"),
  theme: z
    .object({
      primaryColor: z.string().default("#3B82F6"),
      secondaryColor: z.string().default("#10B981"),
      accentColor: z.string().default("#F59E0B"),
      logoUrl: z.string().optional(),
      faviconUrl: z.string().optional(),
    })
    .default({}),
  features: z
    .object({
      bookings: z.boolean().default(true),
      ecommerce: z.boolean().default(true),
      calendar: z.boolean().default(true),
      socialMedia: z.boolean().default(true),
      analytics: z.boolean().default(true),
      multiLanguage: z.boolean().default(false),
      customDomain: z.boolean().default(false),
    })
    .default({}),
});

type TenantInput = z.infer<typeof tenantSchema>;

/**
 * GET /api/tenants - Obtener todos los tenants
 * Solo accesible para administradores del sistema
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar si es un administrador del sistema
    // Por ahora, solo el usuario de zo-system puede acceder
    const allowedEmails = ["admin@zo-system.com", "jagzao@gmail.com"];
    if (!session.user.email || !allowedEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let whereCondition = undefined;
    if (search) {
      whereCondition = or(
        ilike(tenants.name, `%${search}%`),
        ilike(tenants.slug, `%${search}%`),
        ilike(tenants.description, `%${search}%`),
      );
    }

    const tenantsQuery = whereCondition
      ? db
          .select()
          .from(tenants)
          .where(whereCondition)
          .orderBy(asc(tenants.status), desc(tenants.createdAt))
          .limit(limit)
          .offset(offset)
      : db
          .select()
          .from(tenants)
          .orderBy(asc(tenants.status), desc(tenants.createdAt))
          .limit(limit)
          .offset(offset);
    const totalQuery = whereCondition
      ? db.select({ count: count() }).from(tenants).where(whereCondition)
      : db.select({ count: count() }).from(tenants);

    const [allTenants, totalCount] = await Promise.all([
      tenantsQuery,
      totalQuery,
    ]);

    return NextResponse.json({
      tenants: allTenants,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        pages: Math.ceil((totalCount[0]?.count || 0) / limit),
        hasNextPage: page < Math.ceil((totalCount[0]?.count || 0) / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tenants - Crear un nuevo tenant
 * Solo accesible para administradores del sistema
 */
/**
 * POST /api/tenants - Crear un nuevo tenant completo
 * Incluye: Tenant, Configuración, Branding, Usuario Admin, y Datos de Prueba
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    // Allow admin@zo-system.com and jagzao@gmail.com
    const allowedEmails = ["admin@zo-system.com", "jagzao@gmail.com"];

    if (!session?.user?.email || !allowedEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validar datos básicos del tenant (extendemos el schema aquí mismo o podríamos actualizar el z.object arriba)
    // Para simplificar, usamos el schema existente y extraemos los campos adicionales manualmente
    const tenantData = tenantSchema.parse(body);

    // Campos adicionales no en el schema actual, los extraemos del body raw
    // Nota: Deberíamos actualizar el schema Zod idealmente, pero lo haremos dinámicamente aquí
    const { adminUser, seedData } = body;

    // Verificar si el slug ya existe
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantData.slug))
      .limit(1);

    if (existingTenant) {
      return NextResponse.json(
        { error: "El slug ya está en uso" },
        { status: 400 },
      );
    }

    // Iniciar transacción (Atomicidad garantizada)
    const result = await db.transaction(async (tx) => {
      // 1. Crear el Tenant
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          ...tenantData,
          // Asegurar que branding tenga valores por defecto si no vienen
          branding: {
            ...tenantData.theme, // Map theme to branding structure if needed, or use directly
            accentColor: tenantData.theme.accentColor || "#F59E0B",
            logoUrl: tenantData.theme.logoUrl || "",
            faviconUrl: tenantData.theme.faviconUrl || "",
            // Legacy aliases for compatibility
            logo: tenantData.theme.logoUrl || "",
            favicon: tenantData.theme.faviconUrl || "",
            primaryColor: tenantData.theme.primaryColor || "#000000",
            secondaryColor: tenantData.theme.secondaryColor || "#ffffff",
          },
          // Inicializar JSONBs requeridos vacíos si no existen
          contact: {
            email: tenantData.contactEmail,
            phone: tenantData.contactPhone,
          },
          location: {
            address: tenantData.address,
            city: tenantData.city,
            country: tenantData.country,
          },
          quotas: {},
        })
        .returning();

      // 2. Crear Usuario Admin (si se proporcionó)
      if (adminUser && adminUser.email && adminUser.password) {
        // Verificar si el usuario ya existe
        let userId = crypto.randomUUID();
        const [existingUser] = await tx
          .select()
          .from(users)
          .where(eq(users.email, adminUser.email))
          .limit(1);

        if (existingUser) {
          userId = existingUser.id;
          // Opcional: Actualizar password si lo deseamos, o dejarlo como está
        } else {
          // Crear nuevo usuario
          const hashedPassword = await bcrypt.hash(adminUser.password, 10);
          await tx.insert(users).values({
            id: userId,
            email: adminUser.email,
            name: adminUser.name || "Admin",
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Asignar rol de Admin para este tenant
        await tx
          .insert(userRoles)
          .values({
            userId: userId,
            tenantId: newTenant.id,
            role: "Admin",
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [userRoles.userId, userRoles.tenantId],
            set: { role: "Admin" },
          });
      }

      // 3. Insertar Seed Data (Si se solicitó)
      if (seedData) {
        if (seedData.products) {
          // Crear productos de ejemplo (SQL explícito para compatibilidad con esquemas legacy)
          await tx.execute(sql`
            INSERT INTO products (tenant_id, sku, name, description, price, category, active)
            VALUES
              (${newTenant.id}, ${"DEMO-001"}, ${"Producto Demo 1"}, ${"Descripción del producto demo"}, ${"100.00"}, ${"General"}, ${true}),
              (${newTenant.id}, ${"DEMO-002"}, ${"Producto Demo 2 (Premium)"}, ${"Producto de alta calidad"}, ${"250.50"}, ${"Premium"}, ${true})
          `);
        }

        if (seedData.services) {
          // Crear servicios de ejemplo
          await tx.insert(services).values([
            {
              tenantId: newTenant.id,
              name: "Servicio Corte Cabello",
              description: "Corte de cabello profesional",
              price: "350.00",
              duration: "1.0", // 1 hora
              active: true,
            },
          ]);
        }
      }

      return newTenant;
    });

    return NextResponse.json({
      message: "Tenant y recursos creados exitosamente",
      tenant: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error creating tenant:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
