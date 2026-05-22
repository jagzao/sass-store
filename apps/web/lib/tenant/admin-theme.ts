import type { CSSProperties } from "react";
import type { TenantBranding } from "@/types/tenant";
import {
  WN_CHARCOAL,
  WN_GOLD,
  WN_GOLD_HOVER,
} from "@/lib/design/wondernails-brand";

/** Tokens de UI admin alineados al dashboard HomeTenant (fondo claro + acento del tenant). */
export type AdminTheme = {
  primary: string;
  primaryHover: string;
  pageBg: string;
  cardBg: string;
  cardBorder: string;
  headingColor: string;
  bodyColor: string;
  mutedColor: string;
  serifHeading: boolean;
  /** Variables HSL para componentes shadcn dentro del scope */
  backgroundHsl: string;
  foregroundHsl: string;
  cardHsl: string;
  mutedForegroundHsl: string;
  borderHsl: string;
  primaryHsl: string;
};

const LIGHT_SHELL = {
  backgroundHsl: "0 0% 98%",
  foregroundHsl: "220 13% 20%",
  cardHsl: "0 0% 100%",
  mutedForegroundHsl: "220 9% 46%",
  borderHsl: "220 13% 91%",
};

function hexToHsl(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "30 50% 50%";
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const lum = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        hue = ((b - r) / d + 2) / 6;
        break;
      default:
        hue = ((r - g) / d + 4) / 6;
    }
  }
  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(lum * 100)}%`;
}

/**
 * Resuelve tema admin desde `tenants.branding` (JSON) + slug conocido.
 */
export function resolveAdminTheme(
  branding: Partial<TenantBranding> | null | undefined,
  slug: string,
): AdminTheme {
  if (slug === "wondernails") {
    return {
      primary: WN_GOLD,
      primaryHover: WN_GOLD_HOVER,
      pageBg: "#F8F9FA",
      cardBg: "#FFFFFF",
      cardBorder: "#E5E7EB",
      headingColor: WN_GOLD,
      bodyColor: WN_CHARCOAL,
      mutedColor: "#6B7280",
      serifHeading: true,
      primaryHsl: hexToHsl(WN_GOLD),
      ...LIGHT_SHELL,
    };
  }

  const primary = branding?.primaryColor?.trim() || "#4F46E5";
  const secondary = branding?.secondaryColor?.trim() || "#1F2937";

  return {
    primary,
    primaryHover: branding?.accentColor?.trim() || primary,
    pageBg: "#F9FAFB",
    cardBg: "#FFFFFF",
    cardBorder: "#E5E7EB",
    headingColor: primary,
    bodyColor: secondary,
    mutedColor: "#6B7280",
    serifHeading: false,
    primaryHsl: hexToHsl(primary),
    ...LIGHT_SHELL,
  };
}

export function adminCardClass(theme: AdminTheme): string {
  return "rounded-lg border shadow-sm";
}

export function adminCardStyle(theme: AdminTheme): CSSProperties {
  return {
    backgroundColor: theme.cardBg,
    borderColor: theme.cardBorder,
  };
}
