// Design Tokens System - Multi-tenant Theme Management
export interface DesignTokens {
  brand: string; // Primary brand color
  accent: string; // Secondary accent (CTAs)
  bg: string; // Background color
  surface: string; // Card/panel backgrounds
  text: string; // Primary text
  muted: string; // Secondary text
  success: string;
  warning: string;
  danger: string;

  // Fundamentos visuales
  container: {
    maxWidth: string;
  };
  spacing: {
    baseline: string; // 8px baseline
    xs: string; // 8px
    sm: string; // 12px
    md: string; // 16px
    lg: string; // 24px
    xl: string; // 32px
  };
  typography: {
    h1: {
      fontSize: string; // 40-44px
      tracking: string; // -0.4px
    };
    h2: {
      fontSize: string; // 28-32px
      tracking: string; // -0.2px
    };
    h3: {
      fontSize: string; // 22-24px
      tracking: string; // -0.1px
    };
    body: {
      fontSize: string; // 16px
    };
  };
  elevation: {
    card: string; // shadow-xs
    panel: string; // shadow-sm
    modal: string; // shadow-md
  };
  radius: {
    default: string; // rounded-2xl
  };
}

// Default global tokens (rojo/negro)
const defaultTokens: DesignTokens = {
  brand: "#DC2626", // red-600
  accent: "#E11D48", // rose-600
  bg: "#F9FAFB", // gray-50
  surface: "#FFFFFF", // white
  text: "#1F2937", // gray-800
  muted: "#6B7280", // gray-500 (warm gray)
  success: "#16A34A", // green-600
  warning: "#F59E0B", // amber-500
  danger: "#DC2626", // red-600

  container: {
    maxWidth: "1280px",
  },
  spacing: {
    baseline: "8px",
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  typography: {
    h1: {
      fontSize: "2.75rem", // 44px
      tracking: "-0.025em", // -0.4px approx
    },
    h2: {
      fontSize: "2rem", // 32px
      tracking: "-0.0125em", // -0.2px approx
    },
    h3: {
      fontSize: "1.5rem", // 24px
      tracking: "-0.00625em", // -0.1px approx
    },
    body: {
      fontSize: "1rem", // 16px
    },
  },
  elevation: {
    card: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    panel: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    modal: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  },
  radius: {
    default: "1rem", // rounded-2xl
  },
};

// Tenant-specific token overrides
const tenantTokenOverrides: Record<string, Partial<DesignTokens>> = {
  villafuerte: {
    brand: "#0E7C66", // Verde profundo (AA compliant)
    accent: "#E11D48", // Rojo para CTAs
    bg: "#F8FAF9", // Fondo cálido claro
    surface: "#FFFFFF",
    text: "#1F2937",
    muted: "#6B7280",
  },
  wondernails: {
    brand: "#EC4899", // Pink
    accent: "#DC2626", // Red for CTAs
    bg: "#FDF2F8", // Pink tint
    surface: "#FFFFFF",
  },
  vigistudio: {
    brand: "#7C3AED", // Purple
    accent: "#DC2626", // Red for CTAs
    bg: "#FAF5FF", // Purple tint
    surface: "#FFFFFF",
  },
  "centro-tenistico": {
    brand: "#059669", // Green
    accent: "#E11D48", // Rose for CTAs
    bg: "#F0FDF4", // Green tint
    surface: "#FFFFFF",
  },
  "vainilla-vargas": {
    brand: "#F59E0B", // Amber
    accent: "#DC2626", // Red for CTAs
    bg: "#FFFBEB", // Amber tint
    surface: "#FFFFFF",
  },
  "nom-nom": {
    brand: "#10B981", // Emerald
    accent: "#DC2626", // Red for CTAs
    bg: "#ECFDF5", // Emerald tint
    surface: "#FFFFFF",
  },
  delirios: {
    brand: "#8B5CF6", // Violet
    accent: "#DC2626", // Red for CTAs
    bg: "#F5F3FF", // Violet tint
    surface: "#FFFFFF",
  },
  "zo-system": {
    brand: "#DC2626", // Keep default red
    accent: "#E11D48", // Default accent
    bg: "#F9FAFB", // Default
    surface: "#FFFFFF",
  },
};

export function getDesignTokens(tenantSlug: string): DesignTokens {
  const overrides = tenantTokenOverrides[tenantSlug] || {};
  return {
    ...defaultTokens,
    ...overrides,
  };
}

// CSS Custom Properties generator
export function generateCSSCustomProperties(
  tokens: DesignTokens,
): Record<string, string> {
  return {
    "--color-brand": tokens.brand,
    "--color-accent": tokens.accent,
    "--color-bg": tokens.bg,
    "--color-surface": tokens.surface,
    "--color-text": tokens.text,
    "--color-muted": tokens.muted,
    "--color-success": tokens.success,
    "--color-warning": tokens.warning,
    "--color-danger": tokens.danger,

    "--container-max-width": tokens.container.maxWidth,

    "--spacing-baseline": tokens.spacing.baseline,
    "--spacing-xs": tokens.spacing.xs,
    "--spacing-sm": tokens.spacing.sm,
    "--spacing-md": tokens.spacing.md,
    "--spacing-lg": tokens.spacing.lg,
    "--spacing-xl": tokens.spacing.xl,

    "--font-size-h1": tokens.typography.h1.fontSize,
    "--font-size-h2": tokens.typography.h2.fontSize,
    "--font-size-h3": tokens.typography.h3.fontSize,
    "--font-size-body": tokens.typography.body.fontSize,

    "--letter-spacing-h1": tokens.typography.h1.tracking,
    "--letter-spacing-h2": tokens.typography.h2.tracking,
    "--letter-spacing-h3": tokens.typography.h3.tracking,

    "--shadow-card": tokens.elevation.card,
    "--shadow-panel": tokens.elevation.panel,
    "--shadow-modal": tokens.elevation.modal,

    "--radius-default": tokens.radius.default,
  };
}
