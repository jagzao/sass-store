import { db } from "./connection";
import { tenants, services } from "./schema";
import { eq } from "drizzle-orm";

async function migrateZoSystemToBooking() {
  console.log("🔄 Migrating zo-system to booking mode...\n");

  try {
    // 1. Update zo-system to booking mode
    const [updatedTenant] = await db
      .update(tenants)
      .set({
        mode: "booking",
        updatedAt: new Date(),
      })
      .where(eq(tenants.slug, "zo-system"))
      .returning();

    console.log(
      "✅ Updated tenant:",
      updatedTenant.slug,
      "mode:",
      updatedTenant.mode,
    );

    // 2. Check if zo-system has services
    const existingServices = await db
      .select()
      .from(services)
      .where(eq(services.tenantId, updatedTenant.id));

    console.log(
      `\n📋 Existing services for zo-system: ${existingServices.length}`,
    );

    if (existingServices.length === 0) {
      console.log("📝 Adding sample services for zo-system...\n");

      const sampleServices = [
        {
          tenantId: updatedTenant.id,
          name: "Desarrollo SaaS Personalizado",
          description:
            "Desarrollo de aplicaciones multi-tenant escalables con Next.js, PostgreSQL y arquitectura cloud-native. Incluye diseño, implementación y deployment.",
          price: "15000.00",
          duration: 160,
          featured: true,
          active: true,
          metadata: {
            category: "desarrollo",
            tech: ["Next.js", "TypeScript", "PostgreSQL", "AWS"],
            deliveryTime: "4-8 semanas",
          },
        },
        {
          tenantId: updatedTenant.id,
          name: "Consultoría de Arquitectura de Software",
          description:
            "Auditoría técnica de tu arquitectura actual, identificación de bottlenecks y roadmap de optimización.",
          price: "2500.00",
          duration: 8,
          featured: true,
          active: true,
          metadata: {
            category: "consultoria",
            deliveryTime: "1 semana",
          },
        },
        {
          tenantId: updatedTenant.id,
          name: "Starter Kit SaaS Premium",
          description:
            "Plantilla completa lista para producción con autenticación, pagos Stripe, dashboard admin, API GraphQL y más.",
          price: "499.00",
          duration: 2,
          featured: true,
          active: true,
          metadata: {
            category: "producto",
            tech: ["Next.js 14", "TypeScript", "Tailwind", "Drizzle"],
            features: [
              "Multi-tenancy completo",
              "Auth con NextAuth.js",
              "Pagos con Stripe",
              "Dashboard Admin",
              "GraphQL API",
              "PostgreSQL + Drizzle ORM",
            ],
          },
        },
        {
          tenantId: updatedTenant.id,
          name: "Mantenimiento y Soporte Mensual",
          description:
            "Soporte continuo, actualizaciones de seguridad, backups automáticos y monitoreo 24/7.",
          price: "999.00",
          duration: 4,
          featured: false,
          active: true,
          metadata: {
            category: "soporte",
            deliveryTime: "Mensual",
          },
        },
        {
          tenantId: updatedTenant.id,
          name: "Integración de IA Personalizada",
          description:
            "Implementación de modelos de IA para automatización, análisis de datos o asistentes virtuales.",
          price: "5000.00",
          duration: 40,
          featured: true,
          active: true,
          metadata: {
            category: "ia",
            tech: ["OpenAI", "LangChain", "Vector DB"],
            deliveryTime: "2-4 semanas",
          },
        },
        {
          tenantId: updatedTenant.id,
          name: "E-Commerce Template",
          description:
            "Tienda online completa con carrito, checkout, gestión de inventario y panel de administración.",
          price: "349.00",
          duration: 2,
          featured: true,
          active: true,
          metadata: {
            category: "producto",
            tech: ["Next.js", "React", "Tailwind CSS"],
            features: [
              "Carrito de compras completo",
              "Checkout con Stripe",
              "Gestión de inventario",
              "Panel de administración",
              "Reportes de ventas",
            ],
          },
        },
        {
          tenantId: updatedTenant.id,
          name: "API REST/GraphQL Development",
          description:
            "Desarrollo de APIs robustas y documentadas para tu aplicación.",
          price: "3000.00",
          duration: 24,
          featured: false,
          active: true,
          metadata: {
            category: "desarrollo",
            tech: ["Node.js", "GraphQL", "REST"],
            deliveryTime: "2-3 semanas",
          },
        },
        {
          tenantId: updatedTenant.id,
          name: "DevOps & Infrastructure Setup",
          description:
            "Configuración de infraestructura cloud, CI/CD pipelines, Docker, Kubernetes y monitoreo.",
          price: "2000.00",
          duration: 16,
          featured: false,
          active: true,
          metadata: {
            category: "devops",
            tech: ["Docker", "AWS", "GitHub Actions"],
            deliveryTime: "1-2 semanas",
          },
        },
      ];

      const insertedServices = await db
        .insert(services)
        .values(sampleServices)
        .returning();
      console.log(`✅ Added ${insertedServices.length} sample services`);
    } else {
      console.log("✅ Services already exist, skipping seed");
    }

    console.log("\n🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrateZoSystemToBooking();
