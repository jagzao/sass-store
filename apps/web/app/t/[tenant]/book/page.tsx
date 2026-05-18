import {
  getTenantDataForPage,
  type TenantWithData,
} from "@/lib/db/tenant-service";
import {
  CTV_CLAY_ORANGE,
  CTV_PAGE_BG,
} from "@/lib/design/centro-tenistico-brand";
import { WN_PAGE_BG } from "@/lib/design/wondernails-brand";
import { BookCalendarClient } from "./book-calendar-client";

interface BookPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

type TenantServiceRow = TenantWithData["services"][number];

export default async function BookPage({ params }: BookPageProps) {
  const resolvedParams = await params;
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);
  const services = tenantData.services;
  const defaultStaffId = tenantData.staff[0]?.id;

  const isCTV = resolvedParams.tenant === "centro-tenistico";
  const isWondernails = resolvedParams.tenant === "wondernails";

  return (
    <div
      className={
        isCTV || isWondernails
          ? "relative min-h-screen overflow-x-hidden px-4 py-8 sm:py-12"
          : "container mx-auto px-4 py-8 sm:py-10"
      }
      style={
        isCTV
          ? { backgroundColor: CTV_PAGE_BG }
          : isWondernails
            ? { backgroundColor: WN_PAGE_BG }
            : undefined
      }
    >
      {isWondernails ? (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 28%, rgba(200, 160, 255, 0.2) 0%, rgba(255, 255, 255, 0) 58%)",
            }}
          />
        </div>
      ) : null}
      {isCTV ? (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute -right-24 top-1/4 h-[420px] w-[420px] rounded-full opacity-[0.07]"
            style={{ backgroundColor: CTV_CLAY_ORANGE }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(${CTV_CLAY_ORANGE} 1px, transparent 1px), linear-gradient(90deg, ${CTV_CLAY_ORANGE} 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />
        </div>
      ) : null}
      <div className={isCTV || isWondernails ? "relative z-10" : undefined}>
        {services.length > 0 ? (
          <BookCalendarClient
            tenantSlug={tenantData.slug}
            primaryColor={tenantData.branding?.primaryColor || "#111827"}
            services={services.map((s: TenantServiceRow) => ({
              id: s.id,
              name: s.name,
              duration: s.duration || 60,
              price: Number(s.price) || 0,
            }))}
            defaultStaffId={defaultStaffId}
          />
        ) : (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Agenda no disponible
            </h1>
            <p className="text-gray-600">
              Este tenant aun no tiene servicios configurados para agendar
              citas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
