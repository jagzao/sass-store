"use client";

import { useState } from "react";
import Link from "next/link";

interface TenantLogoProps {
  tenantSlug: string;
  tenantName: string;
  primaryColor: string;
  variant?: "default" | "transparent";
  logoUrl?: string; // Add optional logoUrl prop
}

export default function TenantLogo({
  tenantSlug,
  tenantName,
  primaryColor,
  variant = "default",
  logoUrl,
}: TenantLogoProps) {
  const [imageError, setImageError] = useState(false);
  // Retry state: 0 = gold, 1 = flat, 2 = svg, 3 = text (error)
  const [retryStage, setRetryStage] = useState(0);

  const handleImageError = () => {
    if (logoUrl) {
      setImageError(true);
      return;
    }
    if (tenantSlug === "wondernails") {
      // If gold fails (0), try flat (1). If flat fails (1), try svg (2). Else error.
      if (retryStage < 2) {
        setRetryStage((prev) => prev + 1);
        return;
      }
    }
    setImageError(true);
  };

  const getSrc = () => {
    if (logoUrl) return logoUrl;

    if (tenantSlug !== "wondernails") {
      return `/tenants/${tenantSlug}/logo/logo.svg`;
    }

    switch (retryStage) {
      case 0:
        return `/tenants/${tenantSlug}/logo/logo-gold.png`;
      case 1:
        return `/tenants/${tenantSlug}/logo/logo-flat.png`;
      case 2:
        return `/tenants/${tenantSlug}/logo/logo.svg`;
      default:
        return `/tenants/${tenantSlug}/logo/logo-gold.png`;
    }
  };

  return (
    <Link
      href={`/t/${tenantSlug}`}
      className="hover:opacity-80 transition-opacity block"
    >
      <div className="flex items-center gap-4">
        {!imageError ? (
          <img
            key={logoUrl || retryStage} // Force re-render on stage change
            src={getSrc()}
            alt={`${tenantName} logo`}
            className={`h-16 md:h-20 w-auto transition-all duration-300 object-contain ${variant === "transparent" && tenantSlug !== "wondernails" && !logoUrl ? "brightness-0 invert" : ""}`}
            onError={handleImageError}
          />
        ) : (
          <h1
            className={`text-2xl font-bold ${variant === "transparent" ? "text-white" : ""}`}
            style={
              variant === "default"
                ? { color: primaryColor }
                : { color: "#FFFFFF" }
            }
          >
            {tenantName}
          </h1>
        )}
      </div>
    </Link>
  );
}
