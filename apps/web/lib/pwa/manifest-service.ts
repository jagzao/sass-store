/**
 * STRY-026 — PWA manifest dinámico por tenant.
 *
 * Construye un Web App Manifest usando la identidad del tenant
 * (nombre, colores, logo) desde la DB. Sigue Result Pattern: la
 * lectura del tenant puede fallar (NotFound / DB), y se expone como
 * Result<WebAppManifest, DomainError>.
 */

import { NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export interface WebAppManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: "any" | "maskable" | "any maskable";
}

export interface WebAppManifest {
  id: string;
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  display: "standalone";
  orientation: "portrait-primary";
  background_color: string;
  theme_color: string;
  icons: WebAppManifestIcon[];
}

interface TenantBranding {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logo?: string | null;
  logoUrl?: string | null;
}

interface TenantRowForManifest {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  branding: TenantBranding | null;
}

const DEFAULT_THEME_COLOR = "#6366f1";
const DEFAULT_BACKGROUND = "#ffffff";
const DEFAULT_ICON = "/icon-512.png";

function resolveLogo(branding: TenantBranding | null, slug: string): string {
  const logo = branding?.logoUrl || branding?.logo;
  if (!logo || isPlaceholderLogo(logo)) {
    return `/tenants/${slug}/logo/icon-512.png`;
  }
  return logo;
}

function isPlaceholderLogo(logo: string): boolean {
  const v = (logo || "").trim().toLowerCase();
  return (
    !v ||
    v === "placeholder" ||
    v === "/placeholder.svg" ||
    v.startsWith("data:image/svg+xml,%3csvg")
  );
}

function isHex(color: string | null | undefined): boolean {
  return (
    typeof color === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)
  );
}

/**
 * Construye el manifest a partir de los datos del tenant.
 * Función pura — no falla, no hace I/O.
 */
export function buildTenantManifest(
  tenant: TenantRowForManifest,
): WebAppManifest {
  const branding = tenant.branding ?? {};
  const themeColor = isHex(branding.primaryColor)
    ? (branding.primaryColor as string)
    : DEFAULT_THEME_COLOR;

  const shortName =
    tenant.name.length <= 12 ? tenant.name : tenant.name.slice(0, 12);

  const icons: WebAppManifestIcon[] = [
    {
      src: `/tenants/${tenant.slug}/logo/icon-192.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: `/tenants/${tenant.slug}/logo/icon-512.png`,
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: `/tenants/${tenant.slug}/logo/icon-192-maskable.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: `/tenants/${tenant.slug}/logo/icon-512-maskable.png`,
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ];

  return {
    id: `/t/${tenant.slug}`,
    name: tenant.name,
    short_name: shortName,
    description:
      tenant.description || `${tenant.name} — reserva y compra en línea`,
    start_url: `/t/${tenant.slug}`,
    scope: `/t/${tenant.slug}/`,
    display: "standalone",
    orientation: "portrait-primary",
    background_color: DEFAULT_BACKGROUND,
    theme_color: themeColor,
    icons,
  };
}

/**
 * Lee el tenant por slug desde la DB y construye el manifest.
 * Result Pattern: NotFound si no existe, DatabaseError si la query falla.
 */
export async function getTenantManifest(
  slug: string,
): Promise<Result<WebAppManifest, DomainError>> {
  const lookup = await fromPromise(
    db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1),
    (error) =>
      ErrorFactories.database(
        "get_tenant_for_manifest",
        `Failed to load tenant ${slug} for manifest`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!lookup.success) {
    return Err(lookup.error);
  }

  const tenant = lookup.data[0] as TenantRowForManifest | undefined;
  if (!tenant) {
    return Err(ErrorFactories.notFound("Tenant", slug));
  }

  return Ok(buildTenantManifest(tenant));
}

/**
 * Convierte un Result<WebAppManifest, DomainError> en una NextResponse
 * con el Content-Type correcto para un web manifest.
 */
export function manifestToResponse(
  result: Result<WebAppManifest, DomainError>,
): NextResponse {
  if (result.success) {
    return NextResponse.json(result.data, {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  }
  const error = result.error;
  const status =
    error.type === "NotFoundError"
      ? 404
      : error.type === "ValidationError"
        ? 400
        : 500;
  return NextResponse.json(
    { success: false, error: { message: error.message, type: error.type } },
    { status, headers: { "Content-Type": "application/json" } },
  );
}
