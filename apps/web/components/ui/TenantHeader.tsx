"use client";

import React, { useState, useEffect } from 'react';
import TenantLogo from "@/components/ui/TenantLogo";
import TenantNavigation from "@/components/ui/TenantNavigation";
import UserMenu from "@/components/auth/UserMenu";
import { TenantData } from "@/types/tenant";

interface TenantHeaderProps {
  tenantData: TenantData;
  variant?: 'default' | 'transparent';
}

export default function TenantHeader({ tenantData, variant = 'default' }: TenantHeaderProps) {
  const isTransparent = variant === 'transparent';
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isWondernails = tenantData.slug === 'wondernails';
  
  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isTransparent 
          ? isScrolled
            ? isWondernails 
              ? 'bg-[#121212]/85 backdrop-blur-md border-b border-[#D4AF37]/15 shadow-lg'
              : 'bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm'
            : 'bg-transparent border-transparent'
          : 'bg-white/95 backdrop-blur-sm border-b border-gray-200'
      } ${isTransparent ? 'absolute w-full' : ''}`}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <TenantLogo 
          tenantSlug={tenantData.slug}
          tenantName={tenantData.name}
          primaryColor={tenantData.branding.primaryColor}
          variant={variant}
        />
        <TenantNavigation
          tenantSlug={tenantData.slug}
          primaryColor={tenantData.branding.primaryColor}
          mode={tenantData.mode}
          variant={variant}
        />
        <UserMenu tenantSlug={tenantData.slug} variant={variant} />
      </div>
    </header>
  );
}
