'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;

  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  resetSearch: () => void;

  // Page state
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // Theme state
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;

  // Language preference
  language: 'es' | 'en';
  setLanguage: (language: 'es' | 'en') => void;

  // Performance metrics
  performanceMetrics: {
    renderCount: number;
    lastRenderTime: number;
    componentMountTime: number;
  };
  updatePerformanceMetrics: (metrics: Partial<UIStore['performanceMetrics']>) => void;
  incrementRenderCount: () => void;
}

export const useUI = create<UIStore>()(
  persist(
    (set, get) => ({
      // Sidebar
      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      openSidebar: () => set({ sidebarOpen: true }),
      closeSidebar: () => set({ sidebarOpen: false }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      resetSearch: () => set({ searchQuery: '' }),

      // Page
      currentPage: 'home',
      setCurrentPage: (page) => set({ currentPage: page }),

      // Theme
      theme: 'auto',
      setTheme: (theme) => set({ theme }),

      // Language
      language: 'es',
      setLanguage: (language) => set({ language }),

      // Performance
      performanceMetrics: {
        renderCount: 0,
        lastRenderTime: Date.now(),
        componentMountTime: Date.now(),
      },
      updatePerformanceMetrics: (metrics) =>
        set((state) => ({
          performanceMetrics: {
            ...state.performanceMetrics,
            ...metrics,
          },
        })),
      incrementRenderCount: () =>
        set((state) => ({
          performanceMetrics: {
            ...state.performanceMetrics,
            renderCount: state.performanceMetrics.renderCount + 1,
            lastRenderTime: Date.now(),
          },
        })),
    }),
    {
      name: 'sass-store-ui',
      // Only persist certain fields
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Selectors for optimized access
export const selectSidebarOpen = (state: UIStore) => state.sidebarOpen;
export const selectSearchQuery = (state: UIStore) => state.searchQuery;
export const selectTheme = (state: UIStore) => state.theme;
export const selectLanguage = (state: UIStore) => state.language;
