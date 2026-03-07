"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import TenantLogo from "@/components/ui/TenantLogo";
import TenantNavigation from "@/components/ui/TenantNavigation";
import UserMenu from "@/components/auth/UserMenu";
import { TenantData } from "@/types/tenant";

interface TenantHeaderProps {
  tenantData: TenantData;
  variant?: "default" | "transparent" | "dark";
}

export default function TenantHeader({
  tenantData,
  variant,
}: TenantHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // DASHBOARD LAYOUT OVERLAP FIX:
  // If the user is on an admin dashboard route, we completely hide this generic public header
  // so that the DashboardLayoutWrapper's header and sidebar can take over correctly without overlapping logos.
  // ALWAYS place early returns AFTER all hooks.
  const adminRoutes = [
    "/finance",
    "/social",
    "/clientes",
    "/inventory",
    "/bookings",
    "/settings",
    "/contact",
    "/admin",
    "/admin_bookings",
  ];

  // Keep the tenant public header visible on admin calendar,
  // because this screen relies on the same top branding/nav context.
  const isAdminCalendarRoute = pathname?.includes("/admin/calendar");
  const isDashboardRoute =
    !isAdminCalendarRoute && adminRoutes.some((route) => pathname?.includes(route));

  if (isDashboardRoute) {
    return null;
  }

  const effectiveVariant =
    variant || (tenantData.branding.theme === "dark" ? "dark" : "default");
  const isTransparent = variant === "transparent";
  const isDark = effectiveVariant === "dark";
  const isWondernails = tenantData.slug === "wondernails";

  const getHeaderStyles = () => {
    if (isTransparent) {
      if (isScrolled) {
        return isWondernails
          ? "bg-white/75 backdrop-blur-md border-b border-[#C5A059]/15 shadow-[0_20px_40px_-10px_rgba(200,180,220,0.2)]"
          : "bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm";
      }
      return "bg-transparent border-transparent shadow-none";
    }
    if (isDark) {
      return isScrolled
        ? "bg-[#0D0D0D]/80 backdrop-blur-md border-b border-white/10"
        : "bg-transparent border-transparent shadow-none";
    }
    return "bg-white/95 backdrop-blur-sm border-b border-gray-200";
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 w-full ${getHeaderStyles()}`}
      style={{ position: "sticky", top: 0 }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <TenantLogo
          tenantSlug={tenantData.slug}
          tenantName={tenantData.name}
          primaryColor={tenantData.branding.primaryColor}
          variant={effectiveVariant}
          logoUrl={tenantData.branding.logoUrl || tenantData.branding.logo}
        />
        <TenantNavigation
          tenantSlug={tenantData.slug}
          primaryColor={tenantData.branding.primaryColor}
          secondaryColor={tenantData.branding.secondaryColor}
          mode={tenantData.mode}
          variant={effectiveVariant}
          navLinks={tenantData.branding.navLinks}
        />
        <UserMenu tenantSlug={tenantData.slug} variant={effectiveVariant} />
      </div>
    </header>
  );
}
