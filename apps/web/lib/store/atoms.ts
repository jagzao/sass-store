// Modern React state management with Jotai - 2025 best practices
// Avoiding heavy useContext and useEffect patterns
import { atom } from "jotai";
import { atomWithStorage, atomWithReset } from "jotai/utils";

// ⚠️ DEPRECATED: Tenant state management
// 🔄 MIGRATED TO ZUSTAND: Use useTenantStore from @/lib/stores
// Migration guide: /MIGRATION_GUIDE_JOTAI_TO_ZUSTAND.md
export interface TenantData {
  id: string;
  name: string;
  slug: string;
  description: string;
  mode: "catalog" | "booking" | "mixed";
  branding: {
    primaryColor: string;
    secondaryColor?: string;
    heroConfig?: {
      title?: string;
      subtitle?: string;
      backgroundType?: "gradient" | "image" | "solid";
      backgroundImage?: string;
      showContactInfo?: boolean;
      showActionButtons?: boolean;
      customCTA?: Array<{
        text: string;
        href: string;
        style?: "primary" | "secondary";
      }>;
      layout?: "center" | "left" | "right";
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
}

// ❌ DEPRECATED - Use useTenantStore().currentTenant
export const currentTenantAtom = atom<TenantData | null>(null);

// ❌ DEPRECATED - Use useTenantStore().slug
export const tenantSlugAtom = atom<string | null>(null);

// ❌ DEPRECATED - Use useTenantStore().isLoading
export const isLoadingAtom = atom<boolean>(false);

// ❌ DEPRECATED - Use useTenantStore().getBranding()
export const tenantBrandingAtom = atom((get) => {
  const tenant = get(currentTenantAtom);
  return tenant?.branding;
});

// ❌ DEPRECATED - Use useTenantStore().getHeroConfig()
export const heroConfigAtom = atom((get) => {
  const branding = get(tenantBrandingAtom);
  return branding?.heroConfig || {};
});

// ⚠️ DEPRECATED: Cart state management (persistent)
// 🔄 MIGRATED TO ZUSTAND: Use useCart from @/lib/stores instead
//
// These atoms are duplicates of the cart functionality in Zustand.
// DO NOT USE - They will be removed in the next cleanup phase.
//
// Migration guide: /MIGRATION_GUIDE_JOTAI_TO_ZUSTAND.md
//
// Old interface kept for compatibility during migration:
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  metadata?: Record<string, any>;
}

// ❌ DEPRECATED - Use useCart() from @/lib/stores
export const cartItemsAtom = atomWithStorage<CartItem[]>("sass-store-cart-deprecated", []);

// ❌ DEPRECATED - Use useCart().getSubtotal()
export const cartTotalAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
});

// ❌ DEPRECATED - Use useCart().getTotalItems()
export const cartCountAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((count, item) => count + item.quantity, 0);
});

// ⚠️ DEPRECATED: UI state atoms
// 🔄 MIGRATED TO ZUSTAND: Use useUI from @/lib/stores instead
// ❌ DEPRECATED - Use useUI().sidebarOpen / useUI().toggleSidebar()
export const sidebarOpenAtom = atom(false);

// ❌ DEPRECATED - Use useUI().searchQuery / useUI().setSearchQuery()
export const searchQueryAtom = atomWithReset("");

// ❌ DEPRECATED - Use useUI().currentPage / useUI().setCurrentPage()
export const currentPageAtom = atom("home");

// ⚠️ DEPRECATED: Performance metrics
// 🔄 MIGRATED TO ZUSTAND: Use useUI().performanceMetrics
// ❌ DEPRECATED - Use useUI().updatePerformanceMetrics()
export const performanceMetricsAtom = atom({
  renderCount: 0,
  lastRenderTime: Date.now(),
  componentMountTime: Date.now(),
});

// ⚠️ DEPRECATED: Theme and preferences
// 🔄 MIGRATED TO ZUSTAND: Use useUI from @/lib/stores
// ❌ DEPRECATED - Use useUI().theme / useUI().setTheme()
export const themeAtom = atomWithStorage<"light" | "dark" | "auto">(
  "theme",
  "auto",
);

// ❌ DEPRECATED - Use useUI().language / useUI().setLanguage()
export const preferredLanguageAtom = atomWithStorage<"es" | "en">(
  "language",
  "es",
);

// ⚠️ DEPRECATED: Notification system
// 🔄 MIGRATED TO ZUSTAND: Use useNotifications from @/lib/stores
// Or use notify.success(), notify.error(), etc.
export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

// ❌ DEPRECATED - Use useNotifications().notifications
export const notificationsAtom = atom<Notification[]>([]);

// ❌ DEPRECATED - Use notify.success(), notify.error(), etc.
export const addNotificationAtom = atom(
  null,
  (get, set, notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substring(2);
    const newNotification = { ...notification, id };
    const current = get(notificationsAtom);
    set(notificationsAtom, [...current, newNotification]);

    // Auto-remove after duration (default 5s)
    setTimeout(() => {
      const updated = get(notificationsAtom).filter((n) => n.id !== id);
      set(notificationsAtom, updated);
    }, notification.duration || 5000);
  },
);

// ❌ DEPRECATED - Use useNotifications().removeNotification(id)
export const removeNotificationAtom = atom(null, (get, set, id: string) => {
  const current = get(notificationsAtom);
  set(
    notificationsAtom,
    current.filter((n) => n.id !== id),
  );
});

// SEO and metadata atoms
export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, any>;
}

export const seoDataAtom = atom<SEOData>({
  title: "Sass Store - Multi-tenant E-commerce Platform",
  description: "Plataforma de comercio electrónico multi-tenant para negocios",
});

// Dynamic SEO based on tenant
export const dynamicSEOAtom = atom((get) => {
  const tenant = get(currentTenantAtom);
  const baseSEO = get(seoDataAtom);

  if (!tenant) return baseSEO;

  return {
    ...baseSEO,
    title: tenant.name,
    description: tenant.description,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: tenant.name,
      description: tenant.description,
      address: tenant.contact.address,
      telephone: tenant.contact.phone,
      email: tenant.contact.email,
    },
  };
});

// Analytics and tracking
export const analyticsAtom = atom({
  pageViews: 0,
  sessionStart: Date.now(),
  userInteractions: 0,
});

// Optimized carousel state (for complex carousels)
export const carouselStateAtom = atom({
  activeIndex: 0,
  isTransitioning: false,
  direction: null as "next" | "prev" | null,
  autoPlay: true,
});

// Write-only atoms for actions
export const updateCarouselAtom = atom(
  null,
  (get, set, update: Partial<typeof carouselStateAtom>) => {
    const current = get(carouselStateAtom);
    set(carouselStateAtom, { ...current, ...update });
  },
);

// Form state management (lightweight alternative to react-hook-form for simple forms)
export const createFormAtom = <T extends Record<string, any>>(
  initialValue: T,
) => {
  const dataAtom = atom(initialValue);
  const errorsAtom = atom<Partial<Record<keyof T, string>>>({});
  const isSubmittingAtom = atom(false);

  return {
    dataAtom,
    errorsAtom,
    isSubmittingAtom,
    resetAtom: atom(null, (get, set) => {
      set(dataAtom, initialValue);
      set(errorsAtom, {});
      set(isSubmittingAtom, false);
    }),
  };
};

// Export commonly used form atoms
export const loginFormAtom = createFormAtom({
  email: "",
  password: "",
  rememberMe: false,
});

export const contactFormAtom = createFormAtom({
  name: "",
  email: "",
  phone: "",
  message: "",
});

// Global loading states for different operations
export const loadingStatesAtom = atom({
  tenant: false,
  products: false,
  services: false,
  user: false,
  payment: false,
});

export const setLoadingAtom = atom(
  null,
  (get, set, key: keyof typeof loadingStatesAtom, loading: boolean) => {
    const current = get(loadingStatesAtom);
    set(loadingStatesAtom, { ...current, [key]: loading });
  },
);
