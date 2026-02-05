"use client";

import { useState, useEffect } from "react";

interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export function useTenantTheme(tenantSlug?: string) {
  const [theme, setTheme] = useState<TenantTheme>({
    primaryColor: "#4f46e5", // indigo-600
    secondaryColor: "#6366f1", // indigo-500
    accentColor: "#818cf8", // indigo-400
    backgroundColor: "#ffffff",
    textColor: "#1f2937", // gray-800
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Simulate loading theme from API or localStorage
    const loadTheme = async () => {
      try {
        // In a real app, you would fetch the theme from your API based on tenantSlug
        // For now, we'll use a default theme
        setIsLoading(false);

        // Set dark mode based on tenant or system preference
        setIsDark(
          window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches,
        );
      } catch (error) {
        console.error("Error loading tenant theme:", error);
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [tenantSlug]);

  const getFormStyles = () => {
    return {
      backgroundColor: theme.backgroundColor,
      color: theme.textColor,
      borderColor: theme.accentColor,
      label: "block text-sm font-medium text-gray-700 mb-2",
      input:
        "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      textarea:
        "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    };
  };

  return {
    theme,
    isLoading,
    isDark,
    getFormStyles,
    updateTheme: (newTheme: Partial<TenantTheme>) => {
      setTheme((prev) => ({ ...prev, ...newTheme }));
      // In a real app, you would save the theme to your API
    },
  };
}
