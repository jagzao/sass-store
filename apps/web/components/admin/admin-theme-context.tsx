"use client";

import { createContext, useContext } from "react";
import type { AdminTheme } from "@/lib/tenant/admin-theme";

const AdminThemeContext = createContext<AdminTheme | null>(null);

export function AdminThemeProvider({
  theme,
  children,
}: {
  theme: AdminTheme;
  children: React.ReactNode;
}) {
  return (
    <AdminThemeContext.Provider value={theme}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme(): AdminTheme {
  const theme = useContext(AdminThemeContext);
  if (!theme) {
    throw new Error("useAdminTheme debe usarse dentro de AdminThemeScope");
  }
  return theme;
}
