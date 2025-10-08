"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Tenant, TenantContext } from "./types";

const TenantContextImpl = createContext<TenantContext | null>(null);

interface TenantProviderProps {
  children: React.ReactNode;
  tenant: Tenant;
}

export function TenantProvider({
  children,
  tenant: initialTenant,
}: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant>(initialTenant);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply tenant branding to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;

    // Set CSS custom properties for theming
    root.style.setProperty("--color-primary", tenant.branding.primaryColor);
    root.style.setProperty("--color-secondary", tenant.branding.secondaryColor);

    // Update favicon
    const favicon = document.querySelector(
      'link[rel="icon"]',
    ) as HTMLLinkElement;
    if (favicon) {
      favicon.href = tenant.branding.favicon;
    }

    // Update document title
    document.title = `${tenant.name} - Sass Store`;
  }, [tenant]);

  const contextValue: TenantContext = {
    tenant,
    isLoading,
    error,
  };

  return (
    <TenantContextImpl.Provider value={contextValue}>
      {children}
    </TenantContextImpl.Provider>
  );
}

export function useTenant(): TenantContext {
  const context = useContext(TenantContextImpl);

  if (!context) {
    // During static generation or when outside provider, return default context
    return {
      tenant: {
        id: "zo-system",
        name: "Zo System",
        slug: "zo-system",
        description: "Default tenant",
        mode: "catalog",
        status: "active",
        branding: {
          primaryColor: "#DC2626",
          secondaryColor: "#1F2937",
          logo: "https://placeholder.zo.dev/logos/zo-system.png",
          favicon: "https://placeholder.zo.dev/favicons/zo-system.ico",
          website: "https://zo.dev",
        },
        contact: {
          phone: "+1-555-0100",
          email: "hello@zo.dev",
          address: "123 Tech Avenue, San Francisco, CA 94105",
          hours: {
            monday: "9:00-17:00",
            tuesday: "9:00-17:00",
            wednesday: "9:00-17:00",
            thursday: "9:00-17:00",
            friday: "9:00-17:00",
            saturday: "closed",
            sunday: "closed",
          },
        },
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          placeId: "ChIJIQBpAG2ahYAR_6128GcTUEo",
        },
        quotas: {
          storageGB: 5,
          monthlyBudget: 25.0,
          apiCallsPerHour: 1000,
        },
      },
      isLoading: false,
      error: null,
    };
  }

  return context;
}

export function useTenantSlug(): string {
  const { tenant } = useTenant();
  return tenant.slug;
}
