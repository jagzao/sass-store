/**
 * Centralized exports for all Zustand stores
 *
 * Usage:
 * import { useCart, useUI, useTenantStore } from '@/lib/stores';
 */

// Cart store (already existed)
export { useCart } from "@/lib/cart/cart-store";
export type {
  CartItem,
  CartStore,
  CouponCode,
  DeletedItem,
} from "@/lib/cart/cart-store";

// UI store
export {
  useUI,
  selectSidebarOpen,
  selectSearchQuery,
  selectTheme,
  selectLanguage,
} from "./ui-store";

// Notifications store
export {
  useNotifications,
  notify,
  selectNotifications,
  selectNotificationCount,
} from "./notifications-store";
export type { Notification } from "./notifications-store";

// Analytics store
export {
  useAnalytics,
  selectPageViews,
  selectSessionDuration,
  selectUserInteractions,
} from "./analytics-store";

// Tenant store
export {
  useTenantStore,
  selectTenant,
  selectSlug,
  selectIsLoading,
  selectBranding,
  selectPrimaryColor,
  selectHeroConfig,
  selectFeaturedProducts,
  selectFeaturedServices,
} from "./tenant-store-new";
export type { TenantData, SEOData } from "./tenant-store-new";
