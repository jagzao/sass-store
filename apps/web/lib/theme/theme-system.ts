/**
 * Unified Theme System for SASS Store
 *
 * Centralizes tenant branding, colors, typography, and CSS custom properties
 * Provides type-safe theme configuration and utilities
 */

export interface ThemeColors {
  primary: string;
  secondary?: string;
  accent?: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeTypography {
  fontFamily: {
    sans: string;
    serif: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface ThemeRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeShadows {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  none: string;
}

export interface Theme {
  name: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: ThemeShadows;
}

// Default light theme
export const defaultLightTheme: Theme = {
  name: 'default-light',
  mode: 'light',
  colors: {
    primary: '#DC2626', // Red-600
    secondary: '#7C3AED', // Violet-600
    accent: '#F59E0B', // Amber-500
    background: '#FFFFFF',
    foreground: '#09090B', // Zinc-950
    muted: '#F4F4F5', // Zinc-100
    mutedForeground: '#71717A', // Zinc-500
    border: '#E4E4E7', // Zinc-200
    input: '#E4E4E7',
    ring: '#DC2626',
    success: '#16A34A', // Green-600
    warning: '#F59E0B', // Amber-500
    error: '#DC2626', // Red-600
    info: '#3B82F6', // Blue-500
  },
  typography: {
    fontFamily: {
      sans: 'system-ui, -apple-system, sans-serif',
      serif: 'Georgia, serif',
      mono: 'ui-monospace, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
};

// Default dark theme
export const defaultDarkTheme: Theme = {
  ...defaultLightTheme,
  name: 'default-dark',
  mode: 'dark',
  colors: {
    ...defaultLightTheme.colors,
    background: '#09090B',
    foreground: '#FAFAFA',
    muted: '#27272A',
    mutedForeground: '#A1A1AA',
    border: '#27272A',
    input: '#27272A',
  },
};

/**
 * Creates a tenant-specific theme based on their branding colors
 */
export function createTenantTheme(
  tenantBranding: {
    primaryColor: string;
    secondaryColor?: string;
  },
  baseTheme: Theme = defaultLightTheme
): Theme {
  return {
    ...baseTheme,
    name: `tenant-${tenantBranding.primaryColor}`,
    colors: {
      ...baseTheme.colors,
      primary: tenantBranding.primaryColor,
      secondary: tenantBranding.secondaryColor || baseTheme.colors.secondary,
      ring: tenantBranding.primaryColor,
    },
  };
}

/**
 * Converts theme to CSS custom properties
 */
export function themeToCSSVariables(theme: Theme): Record<string, string> {
  return {
    // Colors
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary || theme.colors.primary,
    '--color-accent': theme.colors.accent,
    '--color-background': theme.colors.background,
    '--color-foreground': theme.colors.foreground,
    '--color-muted': theme.colors.muted,
    '--color-muted-foreground': theme.colors.mutedForeground,
    '--color-border': theme.colors.border,
    '--color-input': theme.colors.input,
    '--color-ring': theme.colors.ring,
    '--color-success': theme.colors.success,
    '--color-warning': theme.colors.warning,
    '--color-error': theme.colors.error,
    '--color-info': theme.colors.info,

    // Typography
    '--font-sans': theme.typography.fontFamily.sans,
    '--font-serif': theme.typography.fontFamily.serif,
    '--font-mono': theme.typography.fontFamily.mono,

    // Border radius
    '--radius-sm': theme.radius.sm,
    '--radius-md': theme.radius.md,
    '--radius-lg': theme.radius.lg,
    '--radius-xl': theme.radius.xl,

    // Shadows
    '--shadow-sm': theme.shadows.sm,
    '--shadow-md': theme.shadows.md,
    '--shadow-lg': theme.shadows.lg,
    '--shadow-xl': theme.shadows.xl,
  };
}

/**
 * Applies theme CSS variables to the document
 */
export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const cssVars = themeToCSSVariables(theme);

  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Also set data-theme attribute for CSS selectors
  root.setAttribute('data-theme', theme.name);
  root.setAttribute('data-mode', theme.mode);
}

/**
 * Utility to get color with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Handle rgb/rgba
  if (color.startsWith('rgb')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }

  return color;
}

/**
 * Utility to determine if a color is light or dark
 */
export function isLightColor(color: string): boolean {
  // Simple luminance calculation for hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5;
  }

  return true; // Default to light
}

/**
 * Get contrasting text color for a background
 */
export function getContrastingTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
}
