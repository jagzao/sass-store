"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  socialPlatforms?: string[];
}

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const loadTenant = async () => {
      try {
        setIsLoading(true);

        // Extraer el tenant del pathname
        const pathSegments = pathname.split("/");
        const tenantSlug = pathSegments[2]; // /t/[tenant]/...

        if (!tenantSlug) {
          setTenant(null);
          return;
        }

        // En un entorno real, aquí se haría una llamada a la API para obtener los datos del tenant
        // Por ahora, usaremos datos de demostración basados en el slug
        const mockTenant: Tenant = {
          id: tenantSlug === "wondernails" ? "1" : "2",
          slug: tenantSlug,
          name: tenantSlug === "wondernails" ? "WonderNails" : "Zo System",
          domain:
            tenantSlug === "wondernails" ? "wondernails.com" : "zosystem.com",
          logo: "",
          primaryColor: tenantSlug === "wondernails" ? "#FF6B9D" : "#4F46E5",
          secondaryColor: tenantSlug === "wondernails" ? "#C9184A" : "#7C3AED",
          socialPlatforms:
            tenantSlug === "wondernails"
              ? ["facebook", "instagram", "tiktok"]
              : ["facebook", "instagram", "linkedin", "tiktok"],
        };

        setTenant(mockTenant);
      } catch (error) {
        console.error("Error loading tenant:", error);
        setTenant(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadTenant();
  }, [pathname]);

  return { tenant, isLoading };
}
