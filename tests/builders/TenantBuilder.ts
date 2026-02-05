/**
 * Tenant Data Builder
 *
 * Creates test data for tenant entities following Test Builder pattern.
 * Provides fluent interface for building realistic tenant test objects.
 */

// Simple faker implementation for testing
const testFaker = {
  company: () => ({
    name: () => `Test Company ${Math.random().toString(36).substring(7)}`,
    description: () =>
      `Test description ${Math.random().toString(36).substring(7)}`,
  }),
  internet: {
    email: () => `test-${Math.random().toString(36).substring(7)}@example.com`,
    color: () =>
      `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`,
    url: () =>
      `https://test-url-${Math.random().toString(36).substring(7)}.com`,
  },
  location: {
    streetAddress: () => `${Math.floor(Math.random() * 999)} Test St`,
    city: () => "Test City",
    state: () => "TS",
    country: () => "US",
    timeZone: () => "America/New_York",
    latitude: () => 40.7128 + (Math.random() - 0.5) * 0.1,
    longitude: () => -74.006 + (Math.random() - 0.5) * 0.1,
  },
  phone: () =>
    `555-${Math.floor(Math.random() * 999)
      .toString()
      .padStart(7, "0")}`,
  datatype: {
    uuid: () => `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    string: () => `test-${Math.random().toString(36).substring(7)}`,
  },
  helpers: {
    arrayElement: <T>(array: T[]): T =>
      array[Math.floor(Math.random() * array.length)],
    date: {
      future: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      past: () => new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    lorem: {
      sentence: () =>
        `Test sentence ${Math.random().toString(36).substring(7)}`,
    },
  },
};

// Fix for Date namespace conflict
const currentDate = (): Date => new Date();

export class TenantBuilder {
  private tenant: any = {};

  constructor() {
    // Initialize with a unique ID for each instance
    this.tenant.id = `tenant-${testFaker.datatype.uuid()}`;
  }

  static aTenant(): TenantBuilder {
    return new TenantBuilder();
  }

  withId(id: string): TenantBuilder {
    this.tenant.id = id;
    return this;
  }

  withSlug(slug: string): TenantBuilder {
    this.tenant.slug = slug;
    return this;
  }

  withName(name: string): TenantBuilder {
    this.tenant.name = name;
    return this;
  }

  withDescription(description: string): TenantBuilder {
    this.tenant.description = description;
    return this;
  }

  withMode(mode: "catalog" | "booking" | "mixed"): TenantBuilder {
    this.tenant.mode = mode;
    return this;
  }

  withStatus(status: "active" | "inactive" | "suspended"): TenantBuilder {
    this.tenant.status = status;
    return this;
  }

  withTimezone(timezone: string): TenantBuilder {
    this.tenant.timezone = timezone;
    return this;
  }

  withBranding(branding: any): TenantBuilder {
    this.tenant.branding = {
      logoUrl: testFaker.internet.url(),
      primaryColor: testFaker.internet.color(),
      secondaryColor: testFaker.internet.color(),
      font: "Inter",
      ...branding,
    };
    return this;
  }

  withContact(contact: any): TenantBuilder {
    this.tenant.contact = {
      phone: testFaker.phone.number(),
      email: testFaker.internet.email(),
      address: testFaker.location.streetAddress(),
      ...contact,
    };
    return this;
  }

  withLocation(location: any): TenantBuilder {
    this.tenant.location = {
      address: testFaker.location.streetAddress(),
      city: testFaker.location.city(),
      state: testFaker.location.state(),
      country: testFaker.location.countryCode(),
      latitude: parseFloat(testFaker.location.latitude()),
      longitude: parseFloat(testFaker.location.longitude()),
      ...location,
    };
    return this;
  }

  withQuotas(quotas: any): TenantBuilder {
    this.tenant.quotas = {
      maxProducts: 100,
      maxServices: 50,
      maxUsers: 500,
      storageGB: 10,
      apiCallsPerHour: 1000,
      ...quotas,
    };
    return this;
  }

  withGoogleCalendar(connected: boolean = true): TenantBuilder {
    this.tenant.googleCalendarConnected = connected;
    if (connected) {
      this.tenant.googleCalendarId = testFaker.datatype.uuid();
      this.tenant.googleCalendarTokens = {
        accessToken: testFaker.datatype.string(),
        refreshToken: testFaker.datatype.string(),
        expiresAt: testFaker.date.future(),
      };
    } else {
      this.tenant.googleCalendarId = null;
      this.tenant.googleCalendarTokens = null;
    }
    return this;
  }

  // Presets for common test scenarios
  static catalogTenant(): TenantBuilder {
    return TenantBuilder.aTenant()
      .withMode("catalog")
      .withStatus("active")
      .withQuotas({ maxProducts: 50, maxServices: 25 });
  }

  static bookingTenant(): TenantBuilder {
    return TenantBuilder.aTenant()
      .withMode("booking")
      .withStatus("active")
      .withQuotas({ maxServices: 20, maxUsers: 200 });
  }

  static mixedTenant(): TenantBuilder {
    return TenantBuilder.aTenant()
      .withMode("mixed")
      .withStatus("active")
      .withQuotas({ maxProducts: 30, maxServices: 15, maxUsers: 100 });
  }

  // Realistic random tenant
  static random(): TenantBuilder {
    return TenantBuilder.aTenant()
      .withName(testFaker.company.name())
      .withDescription(testFaker.company.description())
      .withMode(testFaker.helpers.arrayElement(["catalog", "booking", "mixed"]))
      .withStatus("active")
      .withTimezone(testFaker.location.timeZone())
      .withBranding({})
      .withContact({})
      .withLocation({})
      .withQuotas({});
  }

  build(): any {
    const now = currentDate();
    return {
      id: this.tenant.id || `tenant-${testFaker.datatype.uuid()}`,
      slug: this.tenant.slug || `test-${testFaker.datatype.uuid()}`,
      name: this.tenant.name || testFaker.company.name(),
      description: this.tenant.description || testFaker.company.description(),
      mode: this.tenant.mode || "catalog",
      status: this.tenant.status || "active",
      timezone: this.tenant.timezone || "UTC",
      branding: this.tenant.branding || {
        logoUrl: testFaker.internet.url(),
        primaryColor: testFaker.internet.color(),
        secondaryColor: testFaker.internet.color(),
        font: "Inter",
      },
      contact: this.tenant.contact || {
        phone: testFaker.phone.number(),
        email: testFaker.internet.email(),
        address: testFaker.location.streetAddress(),
      },
      location: this.tenant.location || {
        address: testFaker.location.streetAddress(),
        city: testFaker.location.city(),
        state: testFaker.location.state(),
        country: testFaker.location.countryCode(),
        latitude: parseFloat(testFaker.location.latitude()),
        longitude: parseFloat(testFaker.location.longitude()),
      },
      quotas: this.tenant.quotas || {
        maxProducts: 100,
        maxServices: 50,
        maxUsers: 500,
        storageGB: 10,
        apiCallsPerHour: 1000,
      },
      googleCalendarId: this.tenant.googleCalendarId || null,
      googleCalendarTokens: this.tenant.googleCalendarTokens || null,
      googleCalendarConnected: this.tenant.googleCalendarConnected || false,
      createdAt: this.tenant.createdAt || now,
      updatedAt: this.tenant.updatedAt || now,
    };
  }
}
