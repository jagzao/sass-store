'use client';

import { create } from 'zustand';

export interface TenantData {
  id: string;
  name: string;
  slug: string;
  description: string;
  mode: 'catalog' | 'booking' | 'mixed';
  branding: {
    primaryColor: string;
    secondaryColor?: string;
    heroConfig?: {
      title?: string;
      subtitle?: string;
      backgroundType?: 'gradient' | 'image' | 'solid';
      backgroundImage?: string;
      showContactInfo?: boolean;
      showActionButtons?: boolean;
      customCTA?: Array<{
        text: string;
        href: string;
        style?: 'primary' | 'secondary';
      }>;
      layout?: 'center' | 'left' | 'right';
      textColor?: string;
      overlayOpacity?: number;
      useCarousel?: boolean;
    };
  };
  contact: {
    address: string;
    phone: string;
    email?: string;
    hours?: Record<string, string>;
  };
  products?: Array<{
    sku: string;
    name: string;
    price: number;
    featured?: boolean;
    [key: string]: any;
  }>;
  services?: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
    featured?: boolean;
    [key: string]: any;
  }>;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, any>;
}

interface TenantStore {
  // State
  currentTenant: TenantData | null;
  slug: string | null;
  isLoading: boolean;
  error: string | null;

  // SEO State
  seoData: SEOData;

  // Loading states for different operations
  loadingStates: {
    tenant: boolean;
    products: boolean;
    services: boolean;
    user: boolean;
    payment: boolean;
  };

  // Actions
  setTenant: (tenant: TenantData) => void;
  setSlug: (slug: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTenant: () => void;

  // SEO Actions
  setSEOData: (seo: Partial<SEOData>) => void;

  // Loading Actions
  setLoadingState: (key: keyof TenantStore['loadingStates'], loading: boolean) => void;

  // Computed getters
  getBranding: () => TenantData['branding'] | undefined;
  getHeroConfig: () => TenantData['branding']['heroConfig'] | undefined;
  getPrimaryColor: () => string;
  getSecondaryColor: () => string;
  getContact: () => TenantData['contact'] | undefined;
  getFeaturedProducts: () => TenantData['products'];
  getFeaturedServices: () => TenantData['services'];
  getDynamicSEO: () => SEOData;
  isBookingMode: () => boolean;
  isCatalogMode: () => boolean;
  isMixedMode: () => boolean;
}

export const useTenantStore = create<TenantStore>()((set, get) => ({
  // Initial state
  currentTenant: null,
  slug: null,
  isLoading: false,
  error: null,

  seoData: {
    title: 'Sass Store - Multi-tenant E-commerce Platform',
    description: 'Plataforma de comercio electrónico multi-tenant para negocios',
  },

  loadingStates: {
    tenant: false,
    products: false,
    services: false,
    user: false,
    payment: false,
  },

  // Actions
  setTenant: (tenant) => {
    set({
      currentTenant: tenant,
      slug: tenant.slug,
      isLoading: false,
      error: null,
    });

    // Auto-update SEO when tenant changes
    if (tenant) {
      const seoData: SEOData = {
        title: tenant.name,
        description: tenant.description,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: tenant.name,
          description: tenant.description,
          address: tenant.contact.address,
          telephone: tenant.contact.phone,
          email: tenant.contact.email,
        },
      };

      set({ seoData });
    }
  },

  setSlug: (slug) => set({ slug }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  clearTenant: () =>
    set({
      currentTenant: null,
      slug: null,
      isLoading: false,
      error: null,
    }),

  // SEO Actions
  setSEOData: (seo) =>
    set((state) => ({
      seoData: { ...state.seoData, ...seo },
    })),

  // Loading Actions
  setLoadingState: (key, loading) =>
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: loading,
      },
    })),

  // Computed getters
  getBranding: () => get().currentTenant?.branding,

  getHeroConfig: () => get().currentTenant?.branding?.heroConfig,

  getPrimaryColor: () => get().currentTenant?.branding?.primaryColor || '#DC2626',

  getSecondaryColor: () =>
    get().currentTenant?.branding?.secondaryColor || get().getPrimaryColor(),

  getContact: () => get().currentTenant?.contact,

  getFeaturedProducts: () => {
    const tenant = get().currentTenant;
    if (!tenant?.products) return [];
    return tenant.products.filter((p) => p.featured);
  },

  getFeaturedServices: () => {
    const tenant = get().currentTenant;
    if (!tenant?.services) return [];
    return tenant.services.filter((s) => s.featured);
  },

  getDynamicSEO: () => {
    const { currentTenant, seoData } = get();

    if (!currentTenant) return seoData;

    return {
      ...seoData,
      title: currentTenant.name,
      description: currentTenant.description,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: currentTenant.name,
        description: currentTenant.description,
        address: currentTenant.contact.address,
        telephone: currentTenant.contact.phone,
        email: currentTenant.contact.email,
      },
    };
  },

  isBookingMode: () => get().currentTenant?.mode === 'booking',

  isCatalogMode: () => get().currentTenant?.mode === 'catalog',

  isMixedMode: () => get().currentTenant?.mode === 'mixed',
}));

// Selectors for optimized access
export const selectTenant = (state: TenantStore) => state.currentTenant;
export const selectSlug = (state: TenantStore) => state.slug;
export const selectIsLoading = (state: TenantStore) => state.isLoading;
export const selectBranding = (state: TenantStore) => state.currentTenant?.branding;
export const selectPrimaryColor = (state: TenantStore) =>
  state.currentTenant?.branding?.primaryColor || '#DC2626';
export const selectHeroConfig = (state: TenantStore) =>
  state.currentTenant?.branding?.heroConfig;
export const selectFeaturedProducts = (state: TenantStore) =>
  state.currentTenant?.products?.filter((p) => p.featured) || [];
export const selectFeaturedServices = (state: TenantStore) =>
  state.currentTenant?.services?.filter((s) => s.featured) || [];
