// Modern React hooks using Jotai - 2025 best practices
// Replacing heavy useContext and useEffect patterns
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import {
  currentTenantAtom,
  tenantSlugAtom,
  tenantBrandingAtom,
  heroConfigAtom,
  cartItemsAtom,
  cartTotalAtom,
  cartCountAtom,
  addNotificationAtom,
  removeNotificationAtom,
  notificationsAtom,
  seoDataAtom,
  dynamicSEOAtom,
  performanceMetricsAtom,
  loadingStatesAtom,
  setLoadingAtom,
  type TenantData,
  type CartItem,
  type Notification,
} from "@/lib/store/atoms";

// Lightweight tenant management
export const useTenant = () => {
  const [tenant, setTenant] = useAtom(currentTenantAtom);
  const branding = useAtomValue(tenantBrandingAtom);
  const heroConfig = useAtomValue(heroConfigAtom);

  const updateTenant = useCallback(
    (tenantData: TenantData) => {
      setTenant(tenantData);
    },
    [setTenant],
  );

  return {
    tenant,
    branding,
    heroConfig,
    updateTenant,
    isLoaded: !!tenant,
  };
};

// Optimized cart management
export const useCart = () => {
  const [items, setItems] = useAtom(cartItemsAtom);
  const total = useAtomValue(cartTotalAtom);
  const count = useAtomValue(cartCountAtom);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      setItems((current) => {
        const existingIndex = current.findIndex((i) => i.id === item.id);
        if (existingIndex >= 0) {
          const updated = [...current];
          updated[existingIndex].quantity += item.quantity || 1;
          return updated;
        }
        return [...current, { ...item, quantity: item.quantity || 1 }];
      });
    },
    [setItems],
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((current) => current.filter((item) => item.id !== id));
    },
    [setItems],
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(id);
        return;
      }
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, quantity } : item)),
      );
    },
    [setItems, removeItem],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return {
    items,
    total,
    count,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isEmpty: count === 0,
  };
};

// Modern notification system
export const useNotifications = () => {
  const notifications = useAtomValue(notificationsAtom);
  const addNotification = useSetAtom(addNotificationAtom);
  const removeNotification = useSetAtom(removeNotificationAtom);

  const notify = useMemo(
    () => ({
      success: (title: string, message: string, duration?: number) =>
        addNotification({ type: "success", title, message, duration }),
      error: (title: string, message: string, duration?: number) =>
        addNotification({ type: "error", title, message, duration }),
      warning: (title: string, message: string, duration?: number) =>
        addNotification({ type: "warning", title, message, duration }),
      info: (title: string, message: string, duration?: number) =>
        addNotification({ type: "info", title, message, duration }),
    }),
    [addNotification],
  );

  return {
    notifications,
    notify,
    remove: removeNotification,
  };
};

// SEO optimization hook
export const useSEO = () => {
  const [seoData, setSeoData] = useAtom(seoDataAtom);
  const dynamicSEO = useAtomValue(dynamicSEOAtom);

  const updateSEO = useCallback(
    (updates: Partial<typeof seoData>) => {
      setSeoData((current) => ({ ...current, ...updates }));
    },
    [setSeoData],
  );

  // Optimized meta tags object
  const metaTags = useMemo(
    () => ({
      title: dynamicSEO.title,
      description: dynamicSEO.description,
      keywords: dynamicSEO.keywords?.join(", "),
      "og:title": dynamicSEO.title,
      "og:description": dynamicSEO.description,
      "og:image": dynamicSEO.image,
      "og:type": "website",
      "twitter:card": "summary_large_image",
      "twitter:title": dynamicSEO.title,
      "twitter:description": dynamicSEO.description,
      "twitter:image": dynamicSEO.image,
      canonical: dynamicSEO.canonicalUrl,
    }),
    [dynamicSEO],
  );

  return {
    seoData: dynamicSEO,
    metaTags,
    updateSEO,
    structuredData: dynamicSEO.structuredData,
  };
};

// Performance monitoring hook
export const usePerformance = () => {
  const [metrics, setMetrics] = useAtom(performanceMetricsAtom);

  const trackRender = useCallback(() => {
    setMetrics((current) => ({
      ...current,
      renderCount: current.renderCount + 1,
      lastRenderTime: Date.now(),
    }));
  }, [setMetrics]);

  const trackMount = useCallback(() => {
    setMetrics((current) => ({
      ...current,
      componentMountTime: Date.now(),
    }));
  }, [setMetrics]);

  // Web Vitals tracking
  const getPerformanceMetrics = useCallback(() => {
    if (typeof window !== "undefined" && "performance" in window) {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstPaint:
          performance
            .getEntriesByType("paint")
            .find((entry) => entry.name === "first-paint")?.startTime || 0,
        firstContentfulPaint:
          performance
            .getEntriesByType("paint")
            .find((entry) => entry.name === "first-contentful-paint")
            ?.startTime || 0,
        renderCount: metrics.renderCount,
        sessionDuration: Date.now() - metrics.componentMountTime,
      };
    }
    return null;
  }, [metrics]);

  return {
    metrics,
    trackRender,
    trackMount,
    getPerformanceMetrics,
  };
};

// Simplified carousel hook with proper state management
export const useCarousel = (itemCount: number) => {
  const [activeIndex, setActiveIndex] = useAtom(performanceMetricsAtom); // Using existing atom temporarily

  // Simplified next/prev functions without complex state updates
  const next = useCallback(() => {
    setActiveIndex((current) => ({
      ...current,
      renderCount: (current.renderCount + 1) % itemCount, // Using renderCount as activeIndex temporarily
    }));
  }, [itemCount, setActiveIndex]);

  const prev = useCallback(() => {
    setActiveIndex((current) => ({
      ...current,
      renderCount:
        current.renderCount === 0 ? itemCount - 1 : current.renderCount - 1,
    }));
  }, [itemCount, setActiveIndex]);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((current) => ({
        ...current,
        renderCount: index,
      }));
    },
    [setActiveIndex],
  );

  return {
    activeIndex: activeIndex.renderCount % itemCount,
    isTransitioning: false, // Simplified for now
    direction: null,
    next,
    prev,
    goTo,
  };
};

// Loading state management
export const useLoading = () => {
  const loadingStates = useAtomValue(loadingStatesAtom);
  const setLoading = useSetAtom(setLoadingAtom);

  const loading = useMemo(
    () => ({
      tenant: loadingStates.tenant,
      products: loadingStates.products,
      services: loadingStates.services,
      user: loadingStates.user,
      payment: loadingStates.payment,
      any: Object.values(loadingStates).some(Boolean),
    }),
    [loadingStates],
  );

  return {
    loading,
    setLoading,
  };
};

// Optimized data fetching hook (replaces heavy useEffect patterns)
export const useOptimizedFetch = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean;
    dependencies?: readonly unknown[];
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {},
) => {
  const { enabled = true, dependencies = [], onSuccess, onError } = options;
  const { setLoading } = useLoading();
  const { notify } = useNotifications();

  // Use useMemo instead of useEffect for data fetching
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      // @ts-expect-error - tenant loading state
      setLoading("tenant", true);
      const data = await fetcher();
      onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error as Error;
      onError?.(err);
      notify.error("Error", err.message);
      throw error;
    } finally {
      // @ts-expect-error - tenant loading state
      setLoading("tenant", false);
    }
  }, [enabled, fetcher, onSuccess, onError, setLoading, notify]);

  return { fetchData };
};
