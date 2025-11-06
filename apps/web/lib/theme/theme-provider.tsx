'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import {
  Theme,
  defaultLightTheme,
  defaultDarkTheme,
  createTenantTheme,
  applyTheme,
} from './theme-system';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  setTenantBranding: (branding: { primaryColor: string; secondaryColor?: string }) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  tenantBranding?: {
    primaryColor: string;
    secondaryColor?: string;
  };
}

export function ThemeProvider({
  children,
  defaultMode = 'system',
  tenantBranding,
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const [branding, setBranding] = useState(tenantBranding);

  // Determine the actual theme based on mode and system preference
  const theme = useMemo(() => {
    let baseTheme: Theme;

    if (mode === 'system') {
      // Check system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        baseTheme = prefersDark ? defaultDarkTheme : defaultLightTheme;
      } else {
        baseTheme = defaultLightTheme;
      }
    } else {
      baseTheme = mode === 'dark' ? defaultDarkTheme : defaultLightTheme;
    }

    // Apply tenant branding if provided
    if (branding) {
      return createTenantTheme(branding, baseTheme);
    }

    return baseTheme;
  }, [mode, branding]);

  // Apply theme to document when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      // Trigger re-render by setting mode again
      setMode('system');
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [mode]);

  // Persist theme mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', mode);
    }
  }, [mode]);

  // Load theme mode from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-mode') as ThemeMode | null;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setMode(saved);
      }
    }
  }, []);

  const value: ThemeContextValue = {
    theme,
    mode,
    setMode,
    setTenantBranding: setBranding,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access the current theme
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * Hook to get theme-aware colors
 */
export function useThemeColors() {
  const { theme } = useTheme();
  return theme.colors;
}

/**
 * Hook to get theme-aware typography
 */
export function useThemeTypography() {
  const { theme } = useTheme();
  return theme.typography;
}
