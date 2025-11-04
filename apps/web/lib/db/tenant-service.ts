import { db, withTenantContext } from "@sass-store/database";
import { tenants, services, products, staff } from "@sass-store/database";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getOrSetCache, CacheKeys } from "@/lib/cache/redis";

// Mock tenant data for self-healing when DB is not available
const mockTenants = {
  "zo-system": {
    id: "zo-system",
    slug: "zo-system",
    name: "Zo System",
    description: "Desarrollo de software premium y consultoría tecnológica",
    mode: "catalog",
    status: "active",
    branding: {
      primaryColor: "#DC2626",
      secondaryColor: "#991B1B",
      logo: "",
      favicon: "",
    },
    contact: {
      phone: "+52 55 1234 5678",
      email: "info@zo-system.com",
      address: "Ciudad de México, México",
    },
    location: { latitude: 19.4326, longitude: -99.1332, placeId: "" },
    quotas: { storageGB: 5, monthlyBudget: 100, apiCallsPerHour: 1000 },
  },
  wondernails: {
    id: "wondernails",
    slug: "wondernails",
    name: "Wonder Nails Studio",
    description: "Manicure premium con los mejores acabados",
    mode: "booking",
    status: "active",
    branding: {
      primaryColor: "#e91e63",
      secondaryColor: "#ad1457",
      logo: "",
      favicon: "",
    },
    contact: {
      phone: "+52 555 123 4567",
      email: "info@wondernails.mx",
      address: "Colonia Roma Norte, CDMX",
    },
    location: { latitude: 19.4326, longitude: -99.1332, placeId: "" },
    quotas: { storageGB: 5, monthlyBudget: 100, apiCallsPerHour: 1000 },
  },
  vigistudio: {
    id: "vigistudio",
    slug: "vigistudio",
    name: "Vigi Studio",
    description: "Corte y peinado profesional",
    mode: "booking",
    status: "active",
    branding: {
      primaryColor: "#9c27b0",
      secondaryColor: "#7b1fa2",
      logo: "",
      favicon: "",
    },
    contact: {
      phone: "+52 555 234 5678",
      email: "info@vigistudio.mx",
      address: "Polanco, CDMX",
    },
    location: { latitude: 19.4326, longitude: -99.1332, placeId: "" },
    quotas: { storageGB: 5, monthlyBudget: 100, apiCallsPerHour: 1000 },
  },
  "nom-nom": {
    id: "nom-nom",
    slug: "nom-nom",
    name: "Nom Nom",
    description: "Deliciosa comida casera y delivery rápido",
    mode: "catalog",
    status: "active",
    branding: {
      primaryColor: "#ff5722",
      secondaryColor: "#d84315",
      logo: "",
      favicon: "",
    },
    contact: {
      phone: "+52 555 345 6789",
      email: "info@nom-nom.mx",
      address: "Condesa, CDMX",
    },
    location: { latitude: 19.4326, longitude: -99.1332, placeId: "" },
    quotas: { storageGB: 5, monthlyBudget: 100, apiCallsPerHour: 1000 },
  },
  "centro-tenistico": {
    id: "centro-tenistico",
    slug: "centro-tenistico",
    name: "Centro Tenístico",
    description: "Clases de tenis y reserva de canchas",
    mode: "booking",
    status: "active",
    branding: {
      primaryColor: "#4caf50",
      secondaryColor: "#388e3c",
      logo: "",
      favicon: "",
    },
    contact: {
      phone: "+52 555 456 7890",
      email: "info@centro-tenistico.mx",
      address: "Santa Fe, CDMX",
    },
    location: { latitude: 19.4326, longitude: -99.1332, placeId: "" },
    quotas: { storageGB: 5, monthlyBudget: 100, apiCallsPerHour: 1000 },
  },
  delirios: {
    id: "delirios",
    slug: "delirios",
    name: "Delirios Healthy Kitchen",
    description: "Comida saludable gourmet con ingredientes orgánicos",
    mode: "catalog",
    status: "active",
    branding: {
      primaryColor: "#65A30D",
      secondaryColor: "#4D7C0F",
      logo: "",
      favicon: "",
    },
    contact: {
      phone: "+52 555 567 8901",
      email: "info@delirios.mx",
      address: "Condesa, CDMX",
    },
    location: { latitude: 19.4326, longitude: -99.1332, placeId: "" },
    quotas: { storageGB: 5, monthlyBudget: 100, apiCallsPerHour: 1000 },
  },
};

// Mock services data
const mockServices = {
  wondernails: [
    {
      id: "1",
      name: "Gel Manicure",
      description: "Manicure con gel de larga duración",
      price: 45.0,
      duration: 60,
      featured: true,
      active: true,
      metadata: {
        includes: [
          "Nail shaping",
          "Cuticle care",
          "Gel polish",
          "Hand massage",
        ],
      },
    },
    {
      id: "2",
      name: "Pedicure Spa",
      description: "Pedicure relajante con masaje",
      price: 55.0,
      duration: 75,
      featured: true,
      active: true,
      metadata: { includes: ["Foot soak", "Nail care", "Massage", "Polish"] },
    },
  ],
  vigistudio: [
    {
      id: "3",
      name: "Signature Blowout",
      description: "Peinado profesional con productos premium",
      price: 55.0,
      duration: 45,
      featured: true,
      active: true,
      metadata: {
        includes: ["Hair wash", "Styling", "Blow dry", "Finishing products"],
      },
    },
  ],
  "nom-nom": [
    {
      id: "4",
      name: "Ensalada César",
      description: "Ensalada fresca con pollo grillado",
      price: 95.0,
      duration: 15,
      featured: true,
      active: true,
      metadata: {
        includes: ["Lechuga", "Pollo", "Crutones", "Aderezo césar"],
        category: "salads",
      },
    },
    {
      id: "5",
      name: "Pizza Margherita",
      description: "Pizza italiana clásica con ingredientes frescos",
      price: 140.0,
      duration: 20,
      featured: true,
      active: true,
      metadata: {
        includes: ["Tomate", "Mozzarella", "Albahaca", "Aceite de oliva"],
        category: "pizzas",
      },
    },
  ],
  "centro-tenistico": [
    {
      id: "6",
      name: "Clase Individual",
      description: "Clases de tenis personalizadas con instructor profesional",
      price: 800.0,
      duration: 60,
      featured: true,
      active: true,
      metadata: {
        includes: ["Instructor certificado", "Pelotas", "Cancha por 1 hora"],
      },
    },
    {
      id: "7",
      name: "Reserva de Cancha",
      description: "Alquiler de cancha de tenis por hora",
      price: 200.0,
      duration: 60,
      featured: true,
      active: true,
      metadata: {
        includes: ["Cancha por 1 hora", "Iluminación"],
      },
    },
  ],
};

// Mock products data
const mockProducts = {
  wondernails: [
    {
      id: "1",
      sku: "WN-GEL-RED",
      name: "Gel Polish Red",
      description: "Esmalte gel rojo intenso",
      price: 15.0,
      category: "polish",
      featured: true,
      active: true,
      metadata: { color: "red", volume: "10ml" },
    },
  ],
  vigistudio: [
    {
      id: "2",
      sku: "VS-SHAMPOO",
      name: "Premium Shampoo",
      description: "Shampoo profesional para todo tipo de cabello",
      price: 25.0,
      category: "haircare",
      featured: true,
      active: true,
      metadata: { volume: "250ml", type: "all hair types" },
    },
  ],
  "nom-nom": [
    {
      id: "3",
      sku: "NN-SMOOTHIE",
      name: "Smoothie Verde",
      description: "Smoothie nutritivo con espinaca y mango",
      price: 65.0,
      category: "beverages",
      featured: true,
      active: true,
      metadata: { ingredients: "espinaca, mango, plátano", size: "500ml" },
    },
    {
      id: "4",
      sku: "NN-GRANOLA",
      name: "Granola Casera",
      description: "Granola artesanal con frutos secos",
      price: 120.0,
      category: "snacks",
      featured: true,
      active: true,
      metadata: { weight: "250g", ingredients: "avena, almendras, miel" },
    },
  ],
  "centro-tenistico": [
    {
      id: "5",
      sku: "CT-RAQUETA",
      name: "Raqueta Wilson Pro",
      description: "Raqueta profesional de tenis Wilson",
      price: 2500.0,
      category: "equipment",
      featured: true,
      active: true,
      metadata: { brand: "Wilson", weight: "300g", grip: "4 3/8" },
    },
    {
      id: "6",
      sku: "CT-PELOTAS",
      name: "Pelotas Penn Championship",
      description: "Set de 3 pelotas de tenis Penn",
      price: 180.0,
      category: "equipment",
      featured: true,
      active: true,
      metadata: { brand: "Penn", quantity: "3 pelotas", type: "championship" },
    },
  ],
  delirios: [
    {
      id: "7",
      sku: "DEL-ENSALADA",
      name: "Ensalada Detox",
      description: "Ensalada fresca con ingredientes orgánicos",
      price: 120.0,
      category: "salads",
      featured: true,
      active: true,
      metadata: {
        image: "🥗",
        ingredients: "espinaca, quinoa, aguacate",
        calories: "350 kcal",
      },
    },
    {
      id: "8",
      sku: "DEL-BOWL",
      name: "Power Bowl",
      description: "Bowl energético con proteínas y vegetales",
      price: 140.0,
      category: "bowls",
      featured: true,
      active: true,
      metadata: {
        image: "🥙",
        ingredients: "pollo, arroz integral, vegetales",
        calories: "450 kcal",
      },
    },
    {
      id: "9",
      sku: "DEL-JUICE",
      name: "Juice Verde",
      description: "Jugo natural detox",
      price: 65.0,
      category: "beverages",
      featured: true,
      active: true,
      metadata: {
        image: "🥤",
        ingredients: "apio, pepino, manzana verde",
        calories: "80 kcal",
      },
    },
  ],
};

// Mock staff data
const mockStaff = {
  wondernails: [
    {
      id: "1",
      name: "Marialicia Villafuerte H.",
      role: "Senior Nail Technician",
      email: "marialicia@wondernails.mx",
      phone: "+52 555 123 4567",
      specialties: ["Gel nails", "Acrylic", "Nail art"],
      photo: "",
      active: true,
      metadata: { experience: "8 years" },
    },
  ],
  vigistudio: [
    {
      id: "2",
      name: "Carlos Ramirez",
      role: "Master Stylist",
      email: "carlos@vigistudio.mx",
      phone: "+52 555 234 5678",
      specialties: ["Hair styling", "Color"],
      photo: "",
      active: true,
      metadata: { experience: "8 years" },
    },
  ],
  "nom-nom": [
    {
      id: "3",
      name: "Chef Ana Martínez",
      role: "Chef Ejecutiva",
      email: "ana@nom-nom.mx",
      phone: "+52 555 345 6789",
      specialties: ["Cocina mediterránea", "Postres", "Cocina saludable"],
      photo: "",
      active: true,
      metadata: { experience: "12 years" },
    },
  ],
  "centro-tenistico": [
    {
      id: "4",
      name: "Prof. Miguel Torres",
      role: "Instructor Principal",
      email: "miguel@centro-tenistico.mx",
      phone: "+52 555 456 7890",
      specialties: ["Tenis avanzado", "Técnica", "Preparación física"],
      photo: "",
      active: true,
      metadata: { experience: "15 years", certification: "PTR Professional" },
    },
  ],
};

// Optimized in-memory cache for tenant data with LRU eviction
class TenantCache {
  private static cache = new Map<string, any>();
  private static TTL = 15 * 60 * 1000; // 15 minutes cache (increased from 5)
  private static timestamps = new Map<string, number>();
  private static accessCount = new Map<string, number>();
  private static readonly MAX_SIZE = 100; // Max cache entries

  static get(key: string) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.TTL) {
      this.delete(key);
      return null;
    }

    // Track access for LRU
    const count = this.accessCount.get(key) || 0;
    this.accessCount.set(key, count + 1);

    return this.cache.get(key);
  }

  static set(key: string, value: any) {
    // Evict LRU entries if cache is full
    if (this.cache.size >= this.MAX_SIZE) {
      this.evictLRU();
    }

    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    this.accessCount.set(key, 1);
  }

  static delete(key: string) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    this.accessCount.delete(key);
  }

  static clear() {
    this.cache.clear();
    this.timestamps.clear();
    this.accessCount.clear();
  }

  private static evictLRU() {
    let lruKey: string | null = null;
    let minAccess = Infinity;
    let oldestTime = Infinity;

    for (const [key, count] of this.accessCount.entries()) {
      const timestamp = this.timestamps.get(key) || 0;
      if (
        count < minAccess ||
        (count === minAccess && timestamp < oldestTime)
      ) {
        minAccess = count;
        oldestTime = timestamp;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
    }
  }
}

// Real database-driven tenant service
export class TenantService {
  // Get tenant by slug with complete data
  static async getTenantBySlug(slug: string) {
    try {
      console.log(`[TenantService] Fetching tenant from database: ${slug}`);

      // Query the actual database
      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);

      if (tenant && tenant.length > 0) {
        const tenantData = tenant[0];
        console.log(
          `[TenantService] Found tenant in database: ${tenantData.name}`,
        );

        return {
          id: tenantData.id,
          slug: tenantData.slug,
          name: tenantData.name,
          description: tenantData.description,
          mode: tenantData.mode,
          status: tenantData.status,
          branding: tenantData.branding,
          contact: tenantData.contact,
          location: tenantData.location,
          quotas: tenantData.quotas,
        };
      }
    } catch (error) {
      // Log the error but always use mock data when DB is unavailable
      console.error(
        "[TenantService] Database error, falling back to mock data:",
        error,
      );
    }

    // Fallback to mock data when DB connection fails
    console.log(`[TenantService] Using mock data for tenant: ${slug}`);
    const mockTenant = mockTenants[slug as keyof typeof mockTenants];
    return mockTenant || null;
  }

  // Get tenant services (booking-mode tenants)
  static async getTenantServices(tenantId: string) {
    try {
      console.log(
        `[TenantService] Fetching services from database for tenant: ${tenantId}`,
      );

      // Query services from the database with RLS
      const tenantServices = await withTenantContext(
        db,
        tenantId,
        null,
        async (db) => {
          return await db
            .select()
            .from(services)
            .where(eq(services.tenantId, tenantId));
        }
      );

      if (Array.isArray(tenantServices)) {
        console.log(
          `[TenantService] Found ${tenantServices.length} services for tenant: ${tenantId}`,
        );

        return tenantServices.map((service: any) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          featured: service.featured,
          active: service.active,
          description: service.description,
          metadata: service.metadata,
        }));
      }
    } catch (error) {
      console.error("Error fetching services from database:", error);
    }

    // Fallback to mock data
    console.log(`[TenantService] Using mock services for tenant: ${tenantId}`);
    return mockServices[tenantId as keyof typeof mockServices] || [];
  }

  // Get tenant products (catalog-mode tenants)
  static async getTenantProducts(tenantId: string) {
    try {
      console.log(
        `[TenantService] Fetching products from database for tenant: ${tenantId}`,
      );

      // Query products from the database with RLS
      const tenantProducts = await withTenantContext(
        db,
        tenantId,
        null,
        async (db) => {
          return await db
            .select()
            .from(products)
            .where(eq(products.tenantId, tenantId));
        }
      );

      if (Array.isArray(tenantProducts)) {
        console.log(
          `[TenantService] Found ${tenantProducts.length} products for tenant: ${tenantId}`,
        );

        return tenantProducts.map((product: any) => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          category: product.category,
          featured: product.featured,
          active: product.active,
          description: product.description,
          metadata: product.metadata,
        }));
      }
    } catch (error) {
      console.error("Error fetching products from database:", error);
    }

    // Fallback to mock data
    console.log(`[TenantService] Using mock products for tenant: ${tenantId}`);
    return mockProducts[tenantId as keyof typeof mockProducts] || [];
  }

  // Get tenant staff (for booking tenants)
  static async getTenantStaff(tenantId: string) {
    try {
      console.log(
        `[TenantService] Fetching staff from database for tenant: ${tenantId}`,
      );

      // Query staff from the database with RLS
      const tenantStaff = await withTenantContext(
        db,
        tenantId,
        null,
        async (db) => {
          return await db
            .select()
            .from(staff)
            .where(eq(staff.tenantId, tenantId));
        }
      );

      if (Array.isArray(tenantStaff)) {
        console.log(
          `[TenantService] Found ${tenantStaff.length} staff members for tenant: ${tenantId}`,
        );

        return tenantStaff.map((staffMember: any) => ({
          id: staffMember.id,
          name: staffMember.name,
          role: staffMember.role,
          email: staffMember.email,
          phone: staffMember.phone,
          specialties: staffMember.specialties,
          photo: staffMember.photo,
          active: staffMember.active,
          metadata: staffMember.metadata,
        }));
      }
    } catch (error) {
      console.error("Error fetching staff from database:", error);
    }

    // Fallback to mock data
    console.log(`[TenantService] Using mock staff for tenant: ${tenantId}`);
    return mockStaff[tenantId as keyof typeof mockStaff] || [];
  }

  // Get complete tenant data with all relations (optimized with Redis + in-memory cache)
  static async getTenantWithData(slug: string) {
    const memoryCacheKey = `tenant_with_data_${slug}`;
    const redisCacheKey = CacheKeys.tenantWithData(slug);

    // Check in-memory cache first (fastest)
    const memCached = TenantCache.get(memoryCacheKey);
    if (memCached) {
      console.log(`[TenantService] Using in-memory cache for: ${slug}`);
      return memCached;
    }

    // Use Redis cache-aside pattern with 10-minute TTL
    return await getOrSetCache(
      redisCacheKey,
      async () => {
        try {
          console.log(`[TenantService] Fetching complete tenant data for: ${slug}`);

          // Single optimized query to get tenant with all relations in one go
          const tenant = await db
            .select()
            .from(tenants)
            .where(eq(tenants.slug, slug))
            .limit(1);

          if (!tenant || tenant.length === 0) {
            console.log(
              `[TenantService] Tenant not found in database, using mock data: ${slug}`,
            );
            return this.getMockTenantWithData(slug);
          }

          const tenantData = tenant[0];
          console.log(
            `[TenantService] Found tenant in database: ${tenantData.name}`,
          );

          // Parallel fetch of all related data with RLS context
          const [tenantServices, tenantProducts, tenantStaff] = await withTenantContext(
            db,
            tenantData.id,
            null,
            async (db) => {
              return await Promise.all([
                tenantData.mode === "booking"
                  ? db
                      .select()
                      .from(services)
                      .where(eq(services.tenantId, tenantData.id))
                  : Promise.resolve([]),
                db.select().from(products).where(eq(products.tenantId, tenantData.id)),
                tenantData.mode === "booking"
                  ? db.select().from(staff).where(eq(staff.tenantId, tenantData.id))
                  : Promise.resolve([]),
              ]);
            }
          );

          console.log(
            `[TenantService] Loaded ${tenantServices.length} services, ${tenantProducts.length} products, ${tenantStaff.length} staff`,
          );

          const result = {
            id: tenantData.id,
            slug: tenantData.slug,
            name: tenantData.name,
            description: tenantData.description,
            mode: tenantData.mode,
            status: tenantData.status,
            branding: tenantData.branding,
            contact: tenantData.contact,
            location: tenantData.location,
            quotas: tenantData.quotas,
            services: tenantServices.map((service: any) => ({
              id: service.id,
              name: service.name,
              price: service.price,
              duration: service.duration,
              featured: service.featured,
              active: service.active,
              description: service.description,
              metadata: service.metadata,
            })),
            products: tenantProducts.map((product: any) => ({
              id: product.id,
              sku: product.sku,
              name: product.name,
              price: product.price,
              category: product.category,
              featured: product.featured,
              active: product.active,
              description: product.description,
              metadata: product.metadata,
            })),
            staff: tenantStaff.map((staffMember: any) => ({
              id: staffMember.id,
              name: staffMember.name,
              role: staffMember.role,
              email: staffMember.email,
              phone: staffMember.phone,
              specialties: staffMember.specialties,
              photo: staffMember.photo,
              active: staffMember.active,
              metadata: staffMember.metadata,
            })),
          };

          // Also cache in memory for ultra-fast subsequent access
          TenantCache.set(memoryCacheKey, result);
          return result;
        } catch (error) {
          // Log and use fallback - this handles DB connection errors gracefully
          console.error(
            "[TenantService] Error fetching complete tenant data, falling back to mock:",
            error,
          );
          const mockData = this.getMockTenantWithData(slug);

          // Cache mock data to avoid repeated errors
          if (mockData) {
            TenantCache.set(memoryCacheKey, mockData);
          }

          return mockData;
        }
      },
      600 // 10 minutes TTL in Redis
    );
  }

  // Helper method for mock data fallback
  private static getMockTenantWithData(slug: string) {
    console.log(`[TenantService] Looking for mock tenant: "${slug}"`);
    // SECURITY: Redacted sensitive log);
    const mockTenant = mockTenants[slug as keyof typeof mockTenants];
    if (!mockTenant) {
      console.log(`[TenantService] Mock tenant not found for: "${slug}"`);
      return null;
    }

    return {
      ...mockTenant,
      services: mockServices[slug as keyof typeof mockServices] || [],
      products: mockProducts[slug as keyof typeof mockProducts] || [],
      staff: mockStaff[slug as keyof typeof mockStaff] || [],
    };
  }

  // Get featured services/products for homepage
  static async getFeaturedItems(tenantId: string, limit: number = 6) {
    try {
      const [featuredServices, featuredProducts] = await withTenantContext(
        db,
        tenantId,
        null,
        async (db) => {
          return await Promise.all([
            db
              .select()
              .from(services)
              .where(
                and(
                  eq(services.tenantId, tenantId),
                  eq(services.featured, true),
                  eq(services.active, true),
                ),
              )
              .limit(limit),
            db
              .select()
              .from(products)
              .where(
                and(
                  eq(products.tenantId, tenantId),
                  eq(products.featured, true),
                  eq(products.active, true),
                ),
              )
              .limit(limit),
          ]);
        }
      );

      return {
        services: featuredServices,
        products: featuredProducts,
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[Self-Healing] Error fetching featured items, falling back to mock data:",
          error,
        );
      }
      return {
        services:
          tenantId === "wondernails"
            ? [
                {
                  id: "1",
                  name: "Manicure Gel",
                  description: "Manicure premium con acabado gel",
                  price: "35.00",
                },
                {
                  id: "2",
                  name: "Pedicure Spa",
                  description: "Pedicure relajante con masaje",
                  price: "45.00",
                },
              ]
            : [],
        products: [],
      };
    }
  }
}

// Helper function for server components
export async function getTenantDataForPage(slug: string) {
  const tenantData = await TenantService.getTenantWithData(slug);

  if (!tenantData) {
    notFound();
  }

  return tenantData;
}

// Types for better TypeScript support
export type TenantWithData = NonNullable<
  Awaited<ReturnType<typeof TenantService.getTenantWithData>>
>;
export type FeaturedItems = Awaited<
  ReturnType<typeof TenantService.getFeaturedItems>
>;
