'use client';

import React, { useState } from 'react';

interface TenantLogoProps {
  tenantSlug: string;
  tenantName: string;
  primaryColor: string;
  variant?: 'default' | 'transparent';
}

export default function TenantLogo({ tenantSlug, tenantName, primaryColor, variant = 'default' }: TenantLogoProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="flex items-center gap-4">
      {!imageError ? (
        <img
          src={tenantSlug === 'wondernails' ? `/tenants/${tenantSlug}/logo/logo-flat.png` : `/tenants/${tenantSlug}/logo/logo.svg`}
          alt={`${tenantName} logo`}
          className={`h-16 md:h-20 w-auto transition-all duration-300 ${variant === 'transparent' && tenantSlug === 'wondernails' ? 'brightness-0 invert' : ''} ${variant === 'transparent' && tenantSlug !== 'wondernails' ? 'brightness-0 invert' : ''}`}
          onError={handleImageError}
        />
      ) : (
        <h1
          className={`text-2xl font-bold ${variant === 'transparent' ? 'text-white' : ''}`}
          style={variant === 'default' ? { color: primaryColor } : { color: '#FFFFFF' }}
        >
          {tenantName}
        </h1>
      )}
    </div>
  );
}