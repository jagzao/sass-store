/**
 * Mock Database Layer
 *
 * Provides in-memory database functionality for testing without external dependencies.
 * Implements basic CRUD operations with proper test isolation.
 */

export interface MockCollection<T> {
  data: Map<string, T>;
  insert: (item: T) => Promise<T>;
  findById: (id: string) => Promise<T | null>;
  findMany: (filter: (item: T) => boolean) => Promise<T[]>;
  update: (id: string, updates: Partial<T>) => Promise<T | null>;
  delete: (id: string) => Promise<boolean>;
  clear: () => void;
  count: () => number;
}

function createMockCollection<T extends { id?: string }>(
  getId: (item: T) => string,
  createId: () => string = () =>
    `${Date.now()}-${Math.random().toString(36).substring(7)}`,
): MockCollection<T> {
  return {
    data: new Map(),

    async insert(item: T): Promise<T> {
      const id = getId(item) || createId();
      const itemWithId = {
        ...item,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.data.set(id, itemWithId);
      return itemWithId;
    },

    async findById(id: string): Promise<T | null> {
      return this.data.get(id) || null;
    },

    async findMany(filter: (item: T) => boolean): Promise<T[]> {
      return Array.from(this.data.values()).filter(filter) as T[];
    },

    async update(id: string, updates: Partial<T>): Promise<T | null> {
      const existing = this.data.get(id);
      if (!existing) return null;

      const updated = { ...existing, ...updates, updatedAt: new Date() };
      this.data.set(id, updated);
      return updated;
    },

    async delete(id: string): Promise<boolean> {
      return this.data.delete(id);
    },

    clear(): void {
      this.data.clear();
    },

    count(): number {
      return this.data.size;
    },
  };
}

export class MockDatabase {
  // Mock collections
  public tenants: MockCollection<any>;
  public products: MockCollection<any>;
  public users: MockCollection<any>;
  public cart: MockCollection<any>;
  public orders: MockCollection<any>;
  public services: MockCollection<any>;
  public bookings: MockCollection<any>;
  public payments: MockCollection<any>;

  constructor() {
    this.tenants = createMockCollection((item: any) => item.id || item.slug);

    this.products = createMockCollection((item: any) => item.id || item.sku);

    this.users = createMockCollection((item: any) => item.id || item.email);

    this.cart = createMockCollection();
    this.orders = createMockCollection();
    this.services = createMockCollection();
    this.bookings = createMockCollection();
    this.payments = createMockCollection();
  }

  // Clear all collections for test isolation
  clear(): void {
    this.tenants.clear();
    this.products.clear();
    this.users.clear();
    this.cart.clear();
    this.orders.clear();
    this.services.clear();
    this.bookings.clear();
    this.payments.clear();
  }

  // Simulate database errors for testing
  simulateError(operation: string): never {
    const errors = {
      connection: new Error("Database connection failed"),
      timeout: new Error("Database operation timeout"),
      constraint: new Error("Database constraint violation"),
      dead: new Error("Database lock timeout"),
    };

    const error =
      errors[operation as keyof typeof errors] ||
      new Error("Unknown database error");

    throw error;
  }

  // Helper methods for testing
  async transaction<T>(operations: () => Promise<T>): Promise<T> {
    try {
      return await operations();
    } catch (error) {
      throw new Error(`Transaction failed: ${error}`);
    }
  }

  // Seed with realistic test data
  async seedTestData(): Promise<void> {
    // Create sample tenant
    const tenant = await this.tenants.insert({
      id: "test-tenant-1",
      slug: "test-tenant",
      name: "Test Store",
      mode: "catalog",
      status: "active",
      timezone: "UTC",
      branding: {
        logoUrl: "https://example.com/logo.png",
        primaryColor: "#000000",
        secondaryColor: "#FFFFFF",
        font: "Inter",
      },
      contact: {
        phone: "+1-555-0123",
        email: "contact@test.com",
        address: "123 Test St",
      },
      location: {
        address: "123 Test St",
        city: "Test City",
        state: "TS",
        country: "US",
        latitude: 40.7128,
        longitude: -74.006,
      },
      quotas: {
        maxProducts: 100,
        maxServices: 50,
        maxUsers: 500,
        storageGB: 10,
        apiCallsPerHour: 1000,
      },
    });

    // Create sample products
    await this.products.insert({
      id: "product-1",
      tenantId: "test-tenant-1",
      sku: "PROD-001",
      name: "Test Product 1",
      description: "A test product",
      price: "29.99",
      currency: "USD",
      stock: 100,
      status: "active",
      tags: ["test", "sample"],
      imageUrl: "https://example.com/product1.jpg",
    });

    await this.products.insert({
      id: "product-2",
      tenantId: "test-tenant-1",
      sku: "PROD-002",
      name: "Test Product 2",
      description: "Another test product",
      price: "49.99",
      currency: "USD",
      stock: 50,
      status: "active",
      tags: ["premium", "featured"],
      imageUrl: "https://example.com/product2.jpg",
    });

    // Create sample user
    await this.users.insert({
      id: "user-1",
      tenantId: "test-tenant-1",
      email: "test@example.com",
      name: "Test User",
      role: "customer",
      status: "active",
      avatar: "https://example.com/avatar.jpg",
    });

    // Create sample services
    await this.services.insert({
      id: "service-1",
      tenantId: "test-tenant-1",
      name: "Test Service",
      description: "A test service",
      price: "99.99",
      currency: "USD",
      duration: 60,
      status: "active",
      category: "consulting",
      imageUrl: "https://example.com/service1.jpg",
    });

    // Create sample cart
    await this.cart.insert({
      id: "cart-1",
      tenantId: "test-tenant-1",
      userId: "user-1",
      items: [
        {
          productId: "product-1",
          sku: "PROD-001",
          name: "Test Product 1",
          price: "29.99",
          quantity: 2,
          total: "59.98",
        },
      ],
      subtotal: "59.98",
      total: "59.98",
      currency: "USD",
      status: "active",
    });
  }

  // Get collection summary for debugging
  getSummary() {
    return {
      tenants: this.tenants.count(),
      products: this.products.count(),
      users: this.users.count(),
      cart: this.cart.count(),
      orders: this.orders.count(),
      services: this.services.count(),
      bookings: this.bookings.count(),
      payments: this.payments.count(),
    };
  }
}
