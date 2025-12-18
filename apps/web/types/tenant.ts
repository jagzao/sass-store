/**
 * Tenant and related entity types based on database schema
 */

export interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  favicon?: string;
}

export interface TenantContact {
  email: string;
  phone: string;
  address?: string;
  hours?: Record<string, string>;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  googleMaps?: string;
}

export interface TenantLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TenantQuotas {
  maxProducts?: number;
  maxServices?: number;
  maxOrders?: number;
  maxStorage?: number;
}

export interface ProductMetadata {
  image?: string;
  category?: string;
  stock?: number;
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  tags?: string[];
  [key: string]: unknown;
}

export interface ServiceMetadata {
  image?: string;
  category?: string;
  capacity?: number;
  requiresDeposit?: boolean;
  cancellationPolicy?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description?: string;
  price: string | number;
  imageUrl?: string;
  category: string;
  featured?: boolean;
  active?: boolean;
  metadata?: ProductMetadata;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  longDescription?: string;
  price: string | number;
  duration: number; // minutes
  imageUrl?: string;
  beforeImage?: string;
  afterImage?: string;
  featured?: boolean;
  active?: boolean;
  metadata?: ServiceMetadata;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  description?: string;
  mode: "catalog" | "booking";
  status?: "active" | "inactive" | "suspended";
  timezone?: string;
  branding: TenantBranding;
  contact: TenantContact;
  location?: TenantLocation;
  quotas?: TenantQuotas;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface TenantData extends Tenant {
  products: Product[];
  services: Service[];
}

export interface TenantPageData {
  name: string;
  description?: string;
  slug: string;
  mode: "catalog" | "booking";
  branding: TenantBranding;
  contact: TenantContact;
}
