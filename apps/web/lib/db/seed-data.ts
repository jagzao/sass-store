import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./connection";
import { tenants, services, products, staff } from "./schema";
import {
  users,
  userRoles,
  tenantConfigs,
  devProjects,
  devSprints,
  devTasks,
} from "@sass-store/database/schema";
import { eq, and, sql } from "drizzle-orm";

// Seed data that replaces the TENANTS_DATA mock
export async function seedTenantData() {
  console.warn("ðŸŒ± Starting database seed...");

  try {
    // 1. Seed Tenants
    const tenantData = [
      {
        slug: "wondernails",
        name: "Wonder Nails Studio",
        description: "Premium nail art and manicure services",
        mode: "booking",
        status: "active",
        branding: {
          primaryColor: "#EC4899",
          secondaryColor: "#1F2937",
          logo: null,
          heroConfig: {
            title: "ðŸ’… Â¡Transforma tus uñas en obras de arte!",
            subtitle:
              "El estudio de uñas más exclusivo de Texcoco. Especialistas en nail art personalizado y técnicas avanzadas.",
            backgroundType: "gradient",
            showContactInfo: true,
            showActionButtons: true,
            layout: "center",
            textColor: "white",
            overlayOpacity: 0.8,
            customCTA: [
              {
                text: "ðŸŽ¨ Ver Nail Art",
                href: "/t/wondernails/services",
                style: "primary",
              },
              {
                text: "ðŸ’Ž Productos Premium",
                href: "/t/wondernails/products",
                style: "secondary",
              },
            ],
          },
        },
        contact: {
          phone: "+52 55 6406 8409",
          email: "marialiciavh1984@gmail.com",
          address:
            "Cda. 1-a Rtno. 21-3, San Lorenzo, 56140 Texcoco de Mora, 56140 México, MÃ©x.",
          website: "https://wondernails.local",
          googleMaps: "https://maps.app.goo.gl/FS471vtXdFdPTyjEA",
          hours: {
            monday: "9:00-19:00",
            tuesday: "9:00-19:00",
            wednesday: "9:00-19:00",
            thursday: "9:00-20:00",
            friday: "9:00-20:00",
            saturday: "8:00-18:00",
            sunday: "-",
          },
        },
        location: {
          lat: 19.5033062,
          lng: -98.883058,
          timezone: "Mexico",
        },
        quotas: {
          maxServices: 50,
          maxProducts: 100,
          maxStaff: 10,
        },
      },
      {
        slug: "manada-juma",
        name: "Manada Juma",
        description: "Servicios de bienestar y aventura al aire libre",
        mode: "booking",
        status: "active",
        branding: {
          primaryColor: "#7C3AED",
          secondaryColor: "#F59E0B",
        },
        contact: {
          phone: "+52 55 5555 0001",
          email: "hola@manadajuma.local",
          address: "CDMX, México",
          website: "https://manadajuma.local",
          hours: {
            monday: "9:00-18:00",
            tuesday: "9:00-18:00",
            wednesday: "9:00-18:00",
            thursday: "9:00-18:00",
            friday: "9:00-18:00",
            saturday: "9:00-14:00",
            sunday: "Closed",
          },
        },
        location: {
          lat: 19.4326,
          lng: -99.1332,
          timezone: "America/Mexico_City",
        },
        quotas: {
          maxServices: 30,
          maxProducts: 50,
          maxStaff: 10,
        },
      },
      {
        slug: "centro-tenistico",
        name: "Centro Tenístico Villafuerte",
        description: "Professional tennis training and court rental",
        mode: "booking",
        status: "active",
        branding: {
          primaryColor: "#B85C38",
          secondaryColor: "#1F2937",
        },
        contact: {
          phone: "+1-555-0203",
          email: "reservas@centrotenistico.local",
          address: "321 Sports Complex Drive, Malibu, CA 90265",
          website: "https://centrotenistico.local",
          hours: {
            monday: "6:00-22:00",
            tuesday: "6:00-22:00",
            wednesday: "6:00-22:00",
            thursday: "6:00-22:00",
            friday: "6:00-22:00",
            saturday: "6:00-20:00",
            sunday: "7:00-19:00",
          },
        },
        location: {
          lat: 34.0259,
          lng: -118.7798,
          timezone: "America/Los_Angeles",
        },
        quotas: {
          maxServices: 30,
          maxProducts: 75,
          maxStaff: 8,
        },
      },
      {
        slug: "zo-system",
        name: "Zo Systems",
        description:
          "Desarrollo de plataformas SaaS, modernización de aplicaciones .NET e integración de automatización con inteligencia artificial para empresas.",
        mode: "booking",
        status: "active",
        branding: {
          primaryColor: "#DC2626",
          secondaryColor: "#F59E0B",
          theme: "dark",
          logo: "https://placeholder.zo.dev/logos/zo-system.png",
          favicon: "https://placeholder.zo.dev/favicons/zo-system.ico",
          navLinks: [
            { name: "Servicios", href: "/t/zo-system/#servicios" },
            { name: "Casos", href: "/t/zo-system/#casos" },
            { name: "Proceso", href: "/t/zo-system/#proceso" },
            { name: "Stack", href: "/t/zo-system/#stack" },
            { name: "Contacto", href: "/t/zo-system/contact" },
          ],
        },
        contact: {
          phone: "+52 55 4926 4189",
          email: "jagzao@gmail.com",
          address: "Texcoco, Estado de México, México",
          website: "https://zo-system.dev",
          hours: {
            monday: "9:00-18:00",
            tuesday: "9:00-18:00",
            wednesday: "9:00-18:00",
            thursday: "9:00-18:00",
            friday: "9:00-17:00",
            saturday: "By appointment",
            sunday: "Closed",
          },
        },
        location: {
          lat: 19.5104,
          lng: -98.8823,
          timezone: "America/Mexico_City",
        },
        quotas: {
          maxServices: 25,
          maxProducts: 10,
          maxStaff: 5,
        },
      },
    ];

    // Insert tenants and collect IDs
    const insertedTenants = await Promise.all(
      tenantData.map(async (tenant) => {
        const [existingTenant] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.slug, tenant.slug))
          .limit(1);

        if (existingTenant) {
          await db
            .update(tenants)
            .set({
              description: tenant.description,
              branding: tenant.branding,
              contact: tenant.contact,
              location: tenant.location,
              updatedAt: new Date(),
            })
            .where(eq(tenants.slug, tenant.slug));
          console.warn(`âœ… Tenant ${tenant.slug} already exists — updated`);
          return existingTenant;
        }

        const [newTenant] = await db.insert(tenants).values(tenant).returning();

        console.warn(`âœ… Created tenant: ${tenant.slug}`);
        return newTenant;
      }),
    );

    // Create lookup map (filter out undefined values)
    const tenantMap = insertedTenants
      .filter((t) => t && t.slug && t.id)
      .reduce(
        (acc, tenant) => {
          acc[tenant.slug] = tenant.id;
          return acc;
        },
        {} as Record<string, string>,
      );

    // 1.5. Seed Tenant Configs
    const tenantConfigData = [
      {
        tenantId: tenantMap["zo-system"],
        category: "business",
        key: "type",
        value: "development",
      },
    ];

    await Promise.all(
      tenantConfigData.map(async (config) => {
        if (!config.tenantId) return;
        const jsonValue = JSON.stringify(config.value);
        await db
          .insert(tenantConfigs)
          .values({ ...config, value: JSON.stringify(config.value) })
          .onConflictDoUpdate({
            target: [
              tenantConfigs.tenantId,
              tenantConfigs.category,
              tenantConfigs.key,
            ],
            set: { value: jsonValue, updatedAt: new Date() },
          });
        console.warn(
          `✅ Tenant config: ${config.category}.${config.key} → ${config.value}`,
        );
      }),
    );

    // 2. Seed Services
    const serviceData = [
      // Wonder Nails Services
      {
        tenantId: tenantMap["wondernails"],
        name: "Classic Manicure",
        description: "Traditional nail care with polish application",
        price: "35.00",
        duration: 45,
        featured: true,
        active: true,
        metadata: { image: "ðŸ’…", category: "manicure" },
      },
      {
        tenantId: tenantMap["wondernails"],
        name: "Gel Manicure",
        description: "Long-lasting gel polish manicure",
        price: "55.00",
        duration: 60,
        featured: false,
        active: true,
        metadata: { image: "âœ¨", category: "manicure" },
      },
      {
        tenantId: tenantMap["wondernails"],
        name: "Custom Nail Art",
        description: "Hand-painted custom nail designs",
        price: "75.00",
        duration: 90,
        featured: true,
        active: true,
        metadata: { image: "ðŸŽ¨", category: "nail-art" },
      },
      // Vigi Studio Services
      {
        tenantId: tenantMap["vigistudio"],
        name: "Cut & Style",
        description: "Professional haircut and styling",
        price: "85.00",
        duration: 90,
        featured: true,
        active: true,
        metadata: { image: "âœ‚ï¸", category: "haircut" },
      },
      {
        tenantId: tenantMap["vigistudio"],
        name: "Color Treatment",
        description: "Professional hair coloring service",
        price: "150.00",
        duration: 180,
        featured: true,
        active: true,
        metadata: { image: "ðŸŽ¨", category: "color" },
      },
      {
        tenantId: tenantMap["vigistudio"],
        name: "Signature Blowout",
        description: "Professional styling and blowout",
        price: "45.00",
        duration: 45,
        featured: false,
        active: true,
        metadata: { image: "ðŸ’¨", category: "styling" },
      },
      // Centro Tenístico Services
      {
        tenantId: tenantMap["centro-tenistico"],
        name: "Court Rental",
        description: "Professional tennis court rental per hour",
        price: "45.00",
        duration: 60,
        featured: true,
        active: true,
        metadata: { image: "ðŸŽ¾", category: "courts" },
      },
      {
        tenantId: tenantMap["centro-tenistico"],
        name: "Private Tennis Lesson",
        description: "One-on-one tennis instruction",
        price: "120.00",
        duration: 60,
        featured: true,
        active: true,
        metadata: { image: "ðŸ†", category: "lessons" },
      },
      {
        tenantId: tenantMap["centro-tenistico"],
        name: "Group Tennis Class",
        description: "Group tennis instruction (max 4 players)",
        price: "35.00",
        duration: 90,
        featured: false,
        active: true,
        metadata: { image: "ðŸ‘¥", category: "lessons" },
      },
      // Zo Systems Services
      {
        tenantId: tenantMap["zo-system"],
        name: "Desarrollo de plataformas SaaS",
        description:
          "Aplicaciones multi-tenant, portales administrativos, suscripciones, pagos, permisos, dashboards e integraciones empresariales.",
        price: "350.00",
        duration: 960,
        featured: true,
        active: true,
        metadata: {
          image: "ðŸš€",
          category: "saas",
          capabilities: [
            "Multi-tenant",
            "Dashboards",
            "Pagos y suscripciones",
            "Permisos RBAC",
            "Integraciones",
          ],
        },
      },
      {
        tenantId: tenantMap["zo-system"],
        name: "Modernización .NET y cloud",
        description:
          "Migración de sistemas heredados, construcción de APIs, microservicios, Azure, PostgreSQL, SQL Server y optimización de arquitectura.",
        price: "300.00",
        duration: 720,
        featured: true,
        active: true,
        metadata: {
          image: "â˜ï¸",
          category: "modernization",
          capabilities: [
            "Migración .NET",
            "APIs REST",
            "Azure",
            "PostgreSQL / SQL Server",
            "Docker",
          ],
        },
      },
      {
        tenantId: tenantMap["zo-system"],
        name: "Automatización e inteligencia artificial",
        description:
          "Agentes inteligentes, RAG, automatizaciones con n8n, procesamiento documental, asistentes empresariales e integración de modelos de IA.",
        price: "250.00",
        duration: 480,
        featured: true,
        active: true,
        metadata: {
          image: "ðŸ¤–",
          category: "ai",
          capabilities: [
            "Agentes y RAG",
            "n8n",
            "Procesamiento documental",
            "Asistentes empresariales",
            "OpenAI-compatible APIs",
          ],
        },
      },
      {
        tenantId: tenantMap["zo-system"],
        name: "Auditoría y rescate de proyectos",
        description:
          "Revisión de arquitectura, rendimiento, seguridad, deuda técnica, calidad del código y estabilización de aplicaciones existentes.",
        price: "150.00",
        duration: 120,
        featured: true,
        active: true,
        metadata: {
          image: "ðŸ”Ž",
          category: "audit",
          capabilities: [
            "Revisión de arquitectura",
            "Performance",
            "Seguridad",
            "Deuda técnica",
            "Plan de rescate",
          ],
        },
      },
    ];

    // Deactivate old zo-system placeholder services that no longer match seed
    const zoSystemServiceId = tenantMap["zo-system"];
    if (zoSystemServiceId) {
      const currentServiceNames = new Set(
        serviceData
          .filter((s) => s.tenantId === zoSystemServiceId)
          .map((s) => s.name),
      );
      const existingZoServices = await db
        .select({ id: services.id, name: services.name })
        .from(services)
        .where(eq(services.tenantId, zoSystemServiceId));
      await Promise.all(
        existingZoServices.map(async (existing) => {
          if (!currentServiceNames.has(existing.name)) {
            await db
              .update(services)
              .set({ active: false, updatedAt: new Date() })
              .where(eq(services.id, existing.id));
            console.warn(`✅ Deactivated old service: ${existing.name}`);
          }
        }),
      );
    }

    await Promise.all(
      serviceData
        .filter((s) => s.tenantId != null) // Skip services for removed tenants
        .map(async (service) => {
          const [existing] = await db
            .select()
            .from(services)
            .where(
              and(
                eq(services.tenantId, service.tenantId),
                eq(services.name, service.name),
              ),
            )
            .limit(1);

          if (!existing) {
            await db.insert(services).values(service);
            console.warn(`✅ Created service: ${service.name}`);
          } else {
            await db
              .update(services)
              .set({
                description: service.description,
                price: service.price,
                duration: service.duration,
                featured: service.featured,
                active: service.active,
                metadata: service.metadata,
                updatedAt: new Date(),
              })
              .where(eq(services.id, existing.id));
            console.warn(`✅ Updated service: ${service.name}`);
          }
        }),
    );

    // 3. Seed Products
    const productData = [
      // Wonder Nails Products
      {
        tenantId: tenantMap["wondernails"],
        sku: "wn-polish-sunset",
        name: "Sunset Orange Polish",
        description: "Vibrant orange nail polish with high-gloss finish",
        price: "22.00",
        category: "nail-polish",
        featured: true,
        active: true,
        metadata: { image: "ðŸ§¡", color: "#FF6B35" },
      },
      {
        tenantId: tenantMap["wondernails"],
        sku: "wn-polish-midnight",
        name: "Midnight Blue Polish",
        description: "Deep blue nail polish with shimmer",
        price: "22.00",
        category: "nail-polish",
        featured: false,
        active: true,
        metadata: { image: "ðŸ’™", color: "#1E3A8A" },
      },
      {
        tenantId: tenantMap["wondernails"],
        sku: "wn-cuticle-oil",
        name: "Nourishing Cuticle Oil",
        description: "Vitamin E enriched cuticle oil for healthy nails",
        price: "16.00",
        category: "care",
        featured: false,
        active: true,
        metadata: { image: "ðŸŒ¿", ingredients: ["Vitamin E", "Jojoba Oil"] },
      },
      // nom-nom Products
      {
        tenantId: tenantMap["nom-nom"],
        sku: "nn-tacos-carnitas-3pc",
        name: "Tacos de Carnitas (3 pcs)",
        description: "Authentic slow-cooked pork carnitas tacos",
        price: "8.50",
        category: "tacos",
        featured: true,
        active: true,
        metadata: { image: "ðŸŒ®", quantity: 3, spiciness: "mild" },
      },
      {
        tenantId: tenantMap["nom-nom"],
        sku: "nn-tacos-pastor-3pc",
        name: "Tacos de Pastor (3 pcs)",
        description: "Marinated pork with pineapple and onions",
        price: "9.00",
        category: "tacos",
        featured: true,
        active: true,
        metadata: { image: "ðŸ", quantity: 3, spiciness: "medium" },
      },
      {
        tenantId: tenantMap["nom-nom"],
        sku: "nn-quesadilla-cheese",
        name: "Quesadilla de Queso",
        description: "Melted Oaxaca cheese quesadilla with handmade tortilla",
        price: "6.00",
        category: "quesadillas",
        featured: false,
        active: true,
        metadata: { image: "ðŸ§€", cheese: "Oaxaca", vegetarian: true },
      },
      // Zo System Products
      {
        tenantId: tenantMap["zo-system"],
        sku: "zs-mvp-starter",
        name: "MVP Starter — Next.js + Supabase",
        description:
          "Código base para un MVP multi-tenant con autenticación, roles, catálogo y dashboard administrativo. Next.js 14 + Supabase + Tailwind.",
        price: "499.00",
        category: "templates",
        featured: true,
        active: true,
        metadata: {
          image: "ðŸš€",
          tech: ["Next.js", "Supabase", "Tailwind", "TypeScript"],
          license: "MIT",
        },
      },
      {
        tenantId: tenantMap["zo-system"],
        sku: "zs-api-package",
        name: "API Design Package",
        description:
          "Especificación OpenAPI, colección Postman y scaffolding de SDK para tu API REST (.NET 8 / NestJS / Node.js).",
        price: "899.00",
        category: "packages",
        featured: true,
        active: true,
        metadata: {
          image: "ðŸ”—",
          includes: ["OpenAPI spec", "Postman collection", "SDK scaffolding"],
          delivery: "7-14 days",
        },
      },
      {
        tenantId: tenantMap["zo-system"],
        sku: "zs-automation-audit",
        name: "Automation Audit",
        description:
          "Mapeo de procesos manuales repetitivos y propuesta de automatización con n8n/Python. Entregable: diagrama + estimación de ROI.",
        price: "350.00",
        category: "consulting",
        featured: false,
        active: true,
        metadata: {
          image: "âš™ï¸",
          includes: ["Process mapping", "n8n/Python proposal", "ROI estimate"],
          delivery: "3-5 days",
        },
      },
    ];

    await Promise.all(
      productData
        .filter((p) => p.tenantId != null) // Skip products for removed tenants
        .map(async (product) => {
          const [existing] = await db
            .select()
            .from(products)
            .where(
              and(
                eq(products.tenantId, product.tenantId),
                eq(products.sku, product.sku),
              ),
            )
            .limit(1);

          if (!existing) {
            await db.insert(products).values(product);
            console.warn(`✅ Created product: ${product.name}`);
          } else {
            await db
              .update(products)
              .set({
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                featured: product.featured,
                active: product.active,
                metadata: product.metadata,
                updatedAt: new Date(),
              })
              .where(eq(products.id, existing.id));
            console.warn(`✅ Updated product: ${product.name}`);
          }
        }),
    );

    // 4. Seed Staff
    const staffData = [
      {
        tenantId: tenantMap["wondernails"],
        name: "Marialicia Villafuerte Hurtado",
        role: "Admin",
        email: "marialiciavh1984@gmail.com",
        phone: "+52 55 6406 8409",
        active: true,
        specialties: ["manicure", "pedicure", "nail-art", "gel-extensions"],
      },
    ];

    await Promise.all(
      staffData.map(async (member) => {
        const [existing] = await db
          .select()
          .from(staff)
          .where(eq(staff.email, member.email))
          .limit(1);

        if (!existing) {
          await db.insert(staff).values(member);
          console.warn(`âœ… Created staff: ${member.name}`);
        }
      }),
    );

    // 5. Seed Admin User + roles — jagzao@gmail.com / admin in all active tenants
    const adminEmail = "jagzao@gmail.com";
    const adminPassword = "admin";
    let [adminUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const [created] = await db
        .insert(users)
        .values({
          id: randomUUID(),
          email: adminEmail,
          password: hashedPassword,
          name: "Admin User",
          emailVerified: new Date(),
        })
        .returning({ id: users.id });
      adminUser = created;
      console.warn(`✅ Created admin user: ${adminEmail}`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.email, adminEmail));
      // SECURITY: Redacted sensitive log;
    }

    if (adminUser) {
      const activeSlugs = [
        "wondernails",
        "centro-tenistico",
        "manada-juma",
        "zo-system",
      ];
      await Promise.all(
        activeSlugs.map(async (slug) => {
          const tenantId = tenantMap[slug];
          if (!tenantId) return;

          await db
            .insert(userRoles)
            .values({
              userId: adminUser.id,
              tenantId,
              role: "Admin",
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [userRoles.userId, userRoles.tenantId],
              set: { role: "Admin", updatedAt: new Date() },
            });
          console.warn(`✅ Admin role set: ${adminEmail} → ${slug}`);
        }),
      );
    }

    // 6. Seed Development Portal Demo Data (only for zo-system)
    const zoSystemId = tenantMap["zo-system"];
    if (zoSystemId) {
      await seedZoSystemDevelopmentData(db, zoSystemId);
    }

    console.warn("ðŸŽ‰ Database seed completed successfully!");
    return { success: true, tenantCount: insertedTenants.length };
  } catch (error) {
    console.error("âŒ Database seed failed:", error);
    throw error;
  }
}

async function seedZoSystemDevelopmentData(
  db: typeof import("./connection").db,
  tenantId: string,
) {
  const [existingProject] = await db
    .select()
    .from(devProjects)
    .where(
      and(
        eq(devProjects.tenantId, tenantId),
        eq(devProjects.name, "Sass Store — Multi-tenant SaaS"),
      ),
    )
    .limit(1);

  if (existingProject) {
    console.warn("✅ zo-system dev project already exists — skipping");
    return;
  }

  const [project] = await db
    .insert(devProjects)
    .values({
      tenantId,
      name: "Sass Store — Multi-tenant SaaS",
      description:
        "Marketplace multi-tenant con autenticación, catálogo, citas, pagos y panel administrativo.",
      status: "active",
      startDate: "2026-01-01",
      targetDate: "2026-12-31",
      displayOrder: 0,
      metadata: {
        stack: ["Next.js", "TypeScript", "Tailwind", "Drizzle", "PostgreSQL"],
        client: "Zo System internal",
      },
    })
    .returning();

  const sprintData: {
    name: string;
    goal: string;
    status: "planned" | "active" | "completed" | "cancelled";
    startDate: string;
    endDate: string;
    displayOrder: number;
  }[] = [
    {
      name: "Sprint 1 — Fundamentos",
      goal: "Auth multi-tenant, schema base y landing page.",
      status: "completed",
      startDate: "2026-01-06",
      endDate: "2026-01-19",
      displayOrder: 0,
    },
    {
      name: "Sprint 2 — Servicios y citas",
      goal: "CRUD de servicios, bookings y calendario.",
      status: "completed",
      startDate: "2026-01-20",
      endDate: "2026-02-09",
      displayOrder: 1,
    },
    {
      name: "Sprint 3 — Portal de desarrollo",
      goal: "Tablas dev_*, APIs y UI de roadmap para clientes.",
      status: "active",
      startDate: "2026-02-10",
      endDate: "2026-02-23",
      displayOrder: 2,
    },
  ];

  const insertedSprints = await Promise.all(
    sprintData.map(async (sprint) => {
      const [row] = await db
        .insert(devSprints)
        .values({ ...sprint, tenantId, projectId: project.id })
        .returning();
      return row;
    }),
  );

  const taskData: {
    title: string;
    status:
      | "backlog"
      | "todo"
      | "in_progress"
      | "in_review"
      | "done"
      | "blocked";
    priority: string;
    sprintIdx: number;
  }[] = [
    {
      title: "Setup Next.js 14 + Tailwind + fonts",
      status: "done",
      priority: "high",
      sprintIdx: 0,
    },
    {
      title: "Drizzle schema + tenant context",
      status: "done",
      priority: "high",
      sprintIdx: 0,
    },
    {
      title: "Auth flow con NextAuth",
      status: "done",
      priority: "high",
      sprintIdx: 0,
    },
    {
      title: "CRUD servicios y productos",
      status: "done",
      priority: "high",
      sprintIdx: 1,
    },
    {
      title: "Booking flow + Google Calendar",
      status: "done",
      priority: "high",
      sprintIdx: 1,
    },
    {
      title: "Tablas dev_projects / dev_sprints / dev_tasks",
      status: "done",
      priority: "high",
      sprintIdx: 2,
    },
    {
      title: "API /development/projects y /development/daily",
      status: "in_progress",
      priority: "high",
      sprintIdx: 2,
    },
    {
      title: "UI de roadmap y daily reports",
      status: "todo",
      priority: "medium",
      sprintIdx: 2,
    },
  ];

  await Promise.all(
    taskData.map(async (task, index) => {
      const sprint = insertedSprints[task.sprintIdx];
      await db.insert(devTasks).values({
        tenantId,
        projectId: project.id,
        sprintId: sprint?.id ?? null,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assigneeName: "Juan G. Zambrano",
        displayOrder: index,
        completedAt: task.status === "done" ? new Date() : null,
      });
    }),
  );

  console.warn("✅ Created zo-system development demo data");
}

// Helper to run seed from command line
if (require.main === module) {
  seedTenantData()
    .then(() => {
      console.warn("Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
