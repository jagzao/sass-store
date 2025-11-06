'use client';

import { create } from 'zustand';

interface AnalyticsStore {
  // Session tracking
  pageViews: number;
  sessionStart: number;
  userInteractions: number;
  lastActivityTime: number;

  // Performance tracking
  pageLoadTime: number | null;
  averageRenderTime: number;
  slowRenders: number;

  // User behavior
  clickedElements: Map<string, number>;
  searchQueries: string[];
  cartInteractions: number;
  checkoutSteps: number;

  // Actions
  trackPageView: () => void;
  trackInteraction: (elementId?: string) => void;
  trackSearch: (query: string) => void;
  trackCartInteraction: () => void;
  trackCheckoutStep: () => void;
  setPageLoadTime: (time: number) => void;
  updateRenderTime: (time: number) => void;
  resetSession: () => void;

  // Computed
  getSessionDuration: () => number;
  getAverageInteractionRate: () => number;
  getMostClickedElements: () => Array<[string, number]>;
}

export const useAnalytics = create<AnalyticsStore>()((set, get) => ({
  // Initial state
  pageViews: 0,
  sessionStart: Date.now(),
  userInteractions: 0,
  lastActivityTime: Date.now(),
  pageLoadTime: null,
  averageRenderTime: 0,
  slowRenders: 0,
  clickedElements: new Map(),
  searchQueries: [],
  cartInteractions: 0,
  checkoutSteps: 0,

  // Track page view
  trackPageView: () => {
    set((state) => ({
      pageViews: state.pageViews + 1,
      lastActivityTime: Date.now(),
    }));

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Page view tracked');
    }

    // TODO: Send to analytics service
    // analytics.page();
  },

  // Track user interaction
  trackInteraction: (elementId) => {
    set((state) => {
      const clickedElements = new Map(state.clickedElements);

      if (elementId) {
        const currentCount = clickedElements.get(elementId) || 0;
        clickedElements.set(elementId, currentCount + 1);
      }

      return {
        userInteractions: state.userInteractions + 1,
        lastActivityTime: Date.now(),
        clickedElements,
      };
    });

    // TODO: Send to analytics service
    // analytics.track('element_clicked', { elementId });
  },

  // Track search
  trackSearch: (query) => {
    if (!query.trim()) return;

    set((state) => ({
      searchQueries: [...state.searchQueries.slice(-99), query], // Keep last 100
      lastActivityTime: Date.now(),
    }));

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Search tracked:', query);
    }

    // TODO: Send to analytics service
    // analytics.track('search_performed', { query });
  },

  // Track cart interaction
  trackCartInteraction: () => {
    set((state) => ({
      cartInteractions: state.cartInteractions + 1,
      lastActivityTime: Date.now(),
    }));

    // TODO: Send to analytics service
    // analytics.track('cart_interaction');
  },

  // Track checkout step
  trackCheckoutStep: () => {
    set((state) => ({
      checkoutSteps: state.checkoutSteps + 1,
      lastActivityTime: Date.now(),
    }));

    // TODO: Send to analytics service
    // analytics.track('checkout_step');
  },

  // Set page load time
  setPageLoadTime: (time) => {
    set({ pageLoadTime: time });

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Page load time:', time, 'ms');
    }

    // TODO: Send to performance monitoring
    // analytics.track('page_load_time', { time });
  },

  // Update render time
  updateRenderTime: (time) => {
    set((state) => {
      const totalRenders = state.pageViews + 1;
      const newAverage =
        (state.averageRenderTime * state.pageViews + time) / totalRenders;

      return {
        averageRenderTime: newAverage,
        slowRenders: time > 100 ? state.slowRenders + 1 : state.slowRenders,
      };
    });
  },

  // Reset session
  resetSession: () => {
    set({
      pageViews: 0,
      sessionStart: Date.now(),
      userInteractions: 0,
      lastActivityTime: Date.now(),
      pageLoadTime: null,
      averageRenderTime: 0,
      slowRenders: 0,
      clickedElements: new Map(),
      searchQueries: [],
      cartInteractions: 0,
      checkoutSteps: 0,
    });
  },

  // Get session duration in seconds
  getSessionDuration: () => {
    return Math.floor((Date.now() - get().sessionStart) / 1000);
  },

  // Get average interaction rate (interactions per minute)
  getAverageInteractionRate: () => {
    const durationMinutes = get().getSessionDuration() / 60;
    if (durationMinutes === 0) return 0;
    return Math.round(get().userInteractions / durationMinutes);
  },

  // Get most clicked elements
  getMostClickedElements: () => {
    const { clickedElements } = get();
    return Array.from(clickedElements.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  },
}));

// Auto-track page visibility changes
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // User left the page
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] User left page');
      }
    } else {
      // User returned to the page
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] User returned to page');
      }
    }
  });
}

// Selectors
export const selectPageViews = (state: AnalyticsStore) => state.pageViews;
export const selectSessionDuration = (state: AnalyticsStore) =>
  Math.floor((Date.now() - state.sessionStart) / 1000);
export const selectUserInteractions = (state: AnalyticsStore) => state.userInteractions;
