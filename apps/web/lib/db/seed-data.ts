import { db } from "./connection";
import { tenants, services, products, staff } from "./schema";
import { eq } from "drizzle-orm";

// Seed data that replaces the TENANTS_DATA mock
export async function seedTenantData() {
  console.log("🌱 Starting database seed...");

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
            title: "💅 ¡Transforma tus uñas en obras de arte!",
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
                text: "🎨 Ver Nail Art",
                href: "/t/wondernails/services",
                style: "primary",
              },
              {
                text: "💎 Productos Premium",
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
            "Cda. 1-a Rtno. 21-3, San Lorenzo, 56140 Texcoco de Mora, 56140 México, Méx.",
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
        slug: "vigistudio",
        name: "Vigi Studio",
        description: "Modern hair salon and beauty treatments",
        mode: "booking",
        status: "active",
        branding: {
          primaryColor: "#7C3AED",
          secondaryColor: "#1F2937",
        },
        contact: {
          phone: "+1-555-0202",
          email: "appointments@vigistudio.local",
          address:
            "Cda. 1-a Rtno. 21-3, San Lorenzo, 56140 Texcoco de Mora, 56140 México, Méx.",
          website: "https://vigistudio.local",
          hours: {
            monday: "Closed",
            tuesday: "9:00-18:00",
            wednesday: "9:00-18:00",
            thursday: "9:00-20:00",
            friday: "9:00-20:00",
            saturday: "8:00-17:00",
            sunday: "10:00-16:00",
          },
        },
        location: {
          lat: 34.0736,
          lng: -118.4004,
          timezone: "America/Los_Angeles",
        },
        quotas: {
          maxServices: 50,
          maxProducts: 50,
          maxStaff: 15,
        },
      },
      {
        slug: "centro-tenistico",
        name: "Centro Tenístico Villafuerte",
        description: "Professional tennis training and court rental",
        mode: "booking",
        status: "active",
        branding: {
          primaryColor: "#059669",
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
        slug: "delirios",
        name: "Delirios",
        description:
          "Restaurante gourmet con cocina fusión y experiencias culinarias únicas",
        mode: "booking",
        status: "active",
        branding: {
          primaryColor: "#8B4513",
          secondaryColor: "#1F2937",
        },
        contact: {
          phone: "+52-555-0210",
          email: "reservas@delirios.local",
          address: "Av. Reforma 123, CDMX",
          website: "https://delirios.local",
          hours: {
            monday: "Closed",
            tuesday: "13:00-23:00",
            wednesday: "13:00-23:00",
            thursday: "13:00-23:00",
            friday: "13:00-00:00",
            saturday: "12:00-00:00",
            sunday: "12:00-22:00",
          },
        },
        location: {
          lat: 19.4326,
          lng: -99.1332,
          timezone: "America/Mexico_City",
        },
        quotas: {
          maxServices: 40,
          maxProducts: 60,
          maxStaff: 20,
        },
      },
      {
        slug: "nom-nom",
        name: "nom-nom",
        description: "Authentic Mexican street tacos and catering",
        mode: "catalog",
        status: "active",
        branding: {
          primaryColor: "#10B981",
          secondaryColor: "#1F2937",
        },
        contact: {
          phone: "+1-555-0205",
          email: "pedidos@nom-nom.local",
          address: "987 Food Truck Plaza, East LA, CA 90063",
          website: "https://nom-nom.local",
          hours: {
            monday: "11:00-21:00",
            tuesday: "11:00-21:00",
            wednesday: "11:00-21:00",
            thursday: "11:00-22:00",
            friday: "11:00-23:00",
            saturday: "10:00-23:00",
            sunday: "10:00-20:00",
          },
        },
        location: {
          lat: 34.0224,
          lng: -118.1804,
          timezone: "America/Los_Angeles",
        },
        quotas: {
          maxServices: 10,
          maxProducts: 50,
          maxStaff: 8,
        },
      },
      {
        slug: "zo-system",
        name: "Zo System",
        description: "Full-stack software development and consulting services",
        mode: "booking",
        status: "active",
        branding: {
          primaryColor: "#DC2626",
          secondaryColor: "#1F2937",
        },
        contact: {
          phone: "+1-555-0206",
          email: "hello@zo-system.dev",
          address: "123 Tech Hub Drive, Santa Monica, CA 90401",
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
          lat: 34.0195,
          lng: -118.4912,
          timezone: "America/Los_Angeles",
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
          console.log(`✅ Tenant ${tenant.slug} already exists`);
          return existingTenant;
        }

        const [newTenant] = await db.insert(tenants).values(tenant).returning();

        console.log(`✅ Created tenant: ${tenant.slug}`);
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
        metadata: { image: "💅", category: "manicure" },
      },
      {
        tenantId: tenantMap["wondernails"],
        name: "Gel Manicure",
        description: "Long-lasting gel polish manicure",
        price: "55.00",
        duration: 60,
        featured: false,
        active: true,
        metadata: { image: "✨", category: "manicure" },
      },
      {
        tenantId: tenantMap["wondernails"],
        name: "Custom Nail Art",
        description: "Hand-painted custom nail designs",
        price: "75.00",
        duration: 90,
        featured: true,
        active: true,
        metadata: { image: "🎨", category: "nail-art" },
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
        metadata: { image: "✂️", category: "haircut" },
      },
      {
        tenantId: tenantMap["vigistudio"],
        name: "Color Treatment",
        description: "Professional hair coloring service",
        price: "150.00",
        duration: 180,
        featured: true,
        active: true,
        metadata: { image: "🎨", category: "color" },
      },
      {
        tenantId: tenantMap["vigistudio"],
        name: "Signature Blowout",
        description: "Professional styling and blowout",
        price: "45.00",
        duration: 45,
        featured: false,
        active: true,
        metadata: { image: "💨", category: "styling" },
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
        metadata: { image: "🎾", category: "courts" },
      },
      {
        tenantId: tenantMap["centro-tenistico"],
        name: "Private Tennis Lesson",
        description: "One-on-one tennis instruction",
        price: "120.00",
        duration: 60,
        featured: true,
        active: true,
        metadata: { image: "🏆", category: "lessons" },
      },
      {
        tenantId: tenantMap["centro-tenistico"],
        name: "Group Tennis Class",
        description: "Group tennis instruction (max 4 players)",
        price: "35.00",
        duration: 90,
        featured: false,
        active: true,
        metadata: { image: "👥", category: "lessons" },
      },
      // Zo System Services
      {
        tenantId: tenantMap["zo-system"],
        name: "Tech Consultation",
        description:
          "Software architecture and technology strategy consultation",
        price: "150.00",
        duration: 60,
        featured: true,
        active: true,
        metadata: { image: "🧠", category: "consulting" },
      },
      {
        tenantId: tenantMap["zo-system"],
        name: "Code Review",
        description:
          "Comprehensive code review and optimization recommendations",
        price: "200.00",
        duration: 90,
        featured: true,
        active: true,
        metadata: { image: "🔍", category: "development" },
      },
      {
        tenantId: tenantMap["zo-system"],
        name: "API Design Session",
        description: "RESTful API design and documentation session",
        price: "180.00",
        duration: 120,
        featured: false,
        active: true,
        metadata: { image: "🔗", category: "development" },
      },
    ];

    await Promise.all(
      serviceData.map(async (service) => {
        const [existing] = await db
          .select()
          .from(services)
          .where(eq(services.name, service.name))
          .limit(1);

        if (!existing) {
          await db.insert(services).values(service);
          console.log(`✅ Created service: ${service.name}`);
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
        metadata: { image: "🧡", color: "#FF6B35" },
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
        metadata: { image: "💙", color: "#1E3A8A" },
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
        metadata: { image: "🌿", ingredients: ["Vitamin E", "Jojoba Oil"] },
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
        metadata: { image: "🌮", quantity: 3, spiciness: "mild" },
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
        metadata: { image: "🍍", quantity: 3, spiciness: "medium" },
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
        metadata: { image: "🧀", cheese: "Oaxaca", vegetarian: true },
      },
      // Zo System Products
      {
        tenantId: tenantMap["zo-system"],
        sku: "zs-saas-starter",
        name: "SaaS Starter Kit",
        description:
          "Complete multi-tenant SaaS platform template with Next.js, Drizzle, and Neon",
        price: "299.00",
        category: "templates",
        featured: true,
        active: true,
        metadata: {
          image: "💻",
          tech: ["Next.js", "Drizzle", "Neon", "TypeScript"],
          license: "MIT",
        },
      },
      {
        tenantId: tenantMap["zo-system"],
        sku: "zs-api-package",
        name: "API Design Package",
        description: "Complete API documentation and design system",
        price: "899.00",
        category: "packages",
        featured: true,
        active: true,
        metadata: {
          image: "🔗",
          includes: ["OpenAPI spec", "Postman collection", "SDK"],
          delivery: "7-14 days",
        },
      },
    ];

    await Promise.all(
      productData.map(async (product) => {
        const [existing] = await db
          .select()
          .from(products)
          .where(eq(products.sku, product.sku))
          .limit(1);

        if (!existing) {
          await db.insert(products).values(product);
          console.log(`✅ Created product: ${product.name}`);
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
          console.log(`✅ Created staff: ${member.name}`);
        }
      }),
    );

    console.log("🎉 Database seed completed successfully!");
    return { success: true, tenantCount: insertedTenants.length };
  } catch (error) {
    console.error("❌ Database seed failed:", error);
    throw error;
  }
}

// Helper to run seed from command line
if (require.main === module) {
  seedTenantData()
    .then(() => {
      console.log("Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
