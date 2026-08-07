"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import TenantLogo from "@/components/ui/TenantLogo";
import TenantNavigation from "@/components/ui/TenantNavigation";
import { FeedbackHeaderButton } from "@/components/feedback/FeedbackHeaderButton";
import UserMenu from "@/components/auth/UserMenu";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { InstallAppHeaderButton } from "@/components/pwa/InstallAppButton";
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

  const effectiveVariant =
    variant || (tenantData.branding.theme === "dark" ? "dark" : "default");
  const isTransparent = variant === "transparent";
  const isDark = effectiveVariant === "dark";
  const isWondernails = tenantData.slug === "wondernails";
  const isCentroTenistico = tenantData.slug === "centro-tenistico";

  const getHeaderStyles = () => {
    if (isCentroTenistico) {
      return isScrolled
        ? "bg-white/[0.82] backdrop-blur-2xl border-b border-white/60 shadow-[0_18px_55px_rgba(15,23,42,0.14)]"
        : "bg-white/[0.68] backdrop-blur-xl border-b border-white/50 shadow-[0_16px_48px_rgba(15,23,42,0.1)]";
    }
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

  // When transparent and not scrolled, the header should not capture pointer events
  const isPointerTransparent = isTransparent && !isScrolled;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 w-full ${getHeaderStyles()} ${isPointerTransparent ? "pointer-events-none" : "pointer-events-auto"}`}
      style={{ position: "sticky", top: 0 }}
    >
      <div
        className={`container mx-auto px-4 flex items-center justify-between ${isCentroTenistico ? "py-2" : ""} ${isPointerTransparent ? "pointer-events-auto" : ""}`}
      >
        <div className="flex items-center gap-2">
          <TenantLogo
            tenantSlug={tenantData.slug}
            tenantName={tenantData.name}
            primaryColor={tenantData.branding.primaryColor}
            variant={effectiveVariant}
            logoUrl={tenantData.branding.logoUrl || tenantData.branding.logo}
          />
          <FeedbackHeaderButton variant={effectiveVariant} />
        </div>
        <TenantNavigation
          tenantSlug={tenantData.slug}
          primaryColor={tenantData.branding.primaryColor}
          secondaryColor={tenantData.branding.secondaryColor}
          mode={tenantData.mode}
          variant={effectiveVariant}
          navLinks={tenantData.branding.navLinks}
        />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <InstallAppHeaderButton />
          <UserMenu tenantSlug={tenantData.slug} variant={effectiveVariant} />
        </div>
      </div>
    </header>
  );
}
