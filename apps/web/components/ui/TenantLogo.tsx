'use client';

import React, { useState } from 'react';

interface TenantLogoProps {
  tenantSlug: string;
  tenantName: string;
  primaryColor: string;
}

export default function TenantLogo({ tenantSlug, tenantName, primaryColor }: TenantLogoProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="flex items-center gap-4">
      {!imageError ? (
        <img
          src={`/tenants/${tenantSlug}/logo/logo.svg`}
          alt={`${tenantName} logo`}
          className="h-8 w-auto"
          onError={handleImageError}
        />
      ) : (
        <h1
          className="text-2xl font-bold"
          style={{ color: primaryColor }}
        >
          {tenantName}
        </h1>
      )}
    </div>
  );
}