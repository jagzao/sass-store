import type { TenantBranding as BaseTenantBranding } from "@/types/tenant";

export interface TenantBranding extends BaseTenantBranding {
  website?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  mode: "catalog" | "booking";
  status: "active" | "inactive" | "suspended";
  branding: TenantBranding;
  contact: {
    phone: string;
    email: string;
    address: string;
    hours: Record<string, string>;
  };
  location: {
    latitude: number;
    longitude: number;
    placeId: string;
  };
  quotas: {
    storageGB: number;
    monthlyBudget: number;
    apiCallsPerHour: number;
  };
  products?: Product[];
  services?: Service[];
  staff?: Staff[];
  favorites?: string[];
}

export interface Product {
  sku: string;
  name: string;
  price: number;
  category: string;
  description: string;
  featured?: boolean;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  description: string;
  featured?: boolean;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  photo: string;
  googleCalendarId?: string;
}

export interface TenantContext {
  tenant: Tenant;
  isLoading: boolean;
  error: string | null;
}
