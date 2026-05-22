"use client";

import type { AdminTheme } from "@/lib/tenant/admin-theme";
import type { CSSProperties, ReactNode } from "react";
import { AdminThemeProvider } from "@/components/admin/admin-theme-context";

type Props = {
  theme: AdminTheme;
  children: ReactNode;
  className?: string;
};

/**
 * Scope claro para pantallas admin: sobreescribe variables shadcn (globals están en dark).
 */
export function AdminThemeScope({ theme, children, className = "" }: Props) {
  const style: CSSProperties = {
    backgroundColor: theme.pageBg,
    color: theme.bodyColor,
    ["--background" as string]: theme.backgroundHsl,
    ["--foreground" as string]: theme.foregroundHsl,
    ["--card" as string]: theme.cardHsl,
    ["--card-foreground" as string]: theme.foregroundHsl,
    ["--popover" as string]: theme.cardHsl,
    ["--popover-foreground" as string]: theme.foregroundHsl,
    ["--muted-foreground" as string]: theme.mutedForegroundHsl,
    ["--border" as string]: theme.borderHsl,
    ["--input" as string]: theme.borderHsl,
    ["--primary" as string]: theme.primaryHsl,
    ["--primary-foreground" as string]: "0 0% 100%",
    ["--color-primary" as string]: theme.primary,
    ["--admin-page-bg" as string]: theme.pageBg,
  };

  return (
    <AdminThemeProvider theme={theme}>
      <div
        className={`admin-theme-scope min-h-full ${className}`}
        style={style}
      >
        {children}
      </div>
    </AdminThemeProvider>
  );
}
