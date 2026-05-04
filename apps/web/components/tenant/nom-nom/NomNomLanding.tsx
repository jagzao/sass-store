import { Suspense } from "react";
import { fetchRevalidating } from "@/lib/api/fetch-with-cache";
import type { Product } from "@/types/tenant";
import HeroNomNom from "@/components/tenant/nomnom/hero/HeroNomNom";

interface Props {
  tenantSlug: string;
}

const PRIMARY = "#10B981";
const ORANGE = "#F97316";

export default async function NomNomLanding({ tenantSlug }: Props) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero existente */}
      <HeroNomNom />

      {/* Menú destacado */}
      <Suspense fallback={<MenuSkeleton />}>
        <MenuSection tenantSlug={tenantSlug} />
      </Suspense>

      {/* Por qué elegirnos */}
      <WhyUsSection />

      {/* Catering CTA */}
      <CateringSection />

      {/* Info de contacto */}
      <InfoSection />
    </div>
  );
}

async function MenuSection({ tenantSlug }: { tenantSlug: string }) {
  const res = await fetchRevalidating<{ data: Product[] }>(
    `/api/v1/public/products?tenant=${tenantSlug}&limit=8`,
    ["products", tenantSlug],
  );

  const products = res?.data ?? [];

  return (
    <section id="menu" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: PRIMARY }}
          >
            Lo mejor de la calle
          </p>
          <h2 className="text-4xl font-black" style={{ color: "#1A1A1A" }}>
            Nuestro Menú
          </h2>
          <p className="mt-4 text-base" style={{ color: "#6B7280" }}>
            Tacos auténticos con ingredientes frescos, preparados al momento
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <TacoCard
                key={p.id}
                id={p.id}
                name={p.name}
                description={p.description ?? ""}
                price={Number(p.price)}
                tenantSlug={tenantSlug}
                metadata={p.metadata as any}
              />
            ))}
          </div>
        ) : (
          <StaticMenu />
        )}
      </div>
    </section>
  );
}

function TacoCard({
  id,
  name,
  description,
  price,
  tenantSlug,
  metadata,
}: {
  id: string;
  name: string;
  description: string;
  price: number;
  tenantSlug: string;
  metadata?: { spiciness?: string; vegetarian?: boolean; image?: string };
}) {
  const spicyMap: Record<string, string> = {
    mild: "🌶",
    medium: "🌶🌶",
    hot: "🌶🌶🌶",
  };

  return (
    <div
      className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white"
      style={{
        border: "1px solid #F3F4F6",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Image placeholder */}
      <div
        className="h-40 flex items-center justify-center text-5xl"
        style={{ backgroundColor: "#ECFDF5" }}
      >
        {metadata?.vegetarian ? "🥑" : "🌮"}
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-bold text-sm leading-tight"
            style={{ color: "#1A1A1A" }}
          >
            {name}
          </h3>
          {metadata?.spiciness && (
            <span className="text-xs flex-shrink-0">
              {spicyMap[metadata.spiciness] ?? ""}
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
          {description}
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-black" style={{ color: PRIMARY }}>
            ${price.toFixed(2)}
          </span>
          <a
            href={`/t/${tenantSlug}/cart`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            Pedir
          </a>
        </div>
      </div>
    </div>
  );
}

function StaticMenu() {
  const items = [
    {
      name: "Tacos de Carnitas",
      desc: "Estilo Michoacán, tiernas y jugosas",
      price: 8.5,
      veg: false,
      spicy: "mild",
    },
    {
      name: "Tacos al Pastor",
      desc: "Con piña asada, cebolla y cilantro",
      price: 9.0,
      veg: false,
      spicy: "medium",
    },
    {
      name: "Quesadilla de Queso",
      desc: "Queso Oaxaca derretido en tortilla",
      price: 6.0,
      veg: true,
      spicy: "mild",
    },
    {
      name: "Tacos Vegetarianos",
      desc: "Champiñones, pimientos y aguacate",
      price: 8.0,
      veg: true,
      spicy: "mild",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <TacoCard
          key={item.name}
          id=""
          name={item.name}
          description={item.desc}
          price={item.price}
          tenantSlug="nom-nom"
          metadata={{ vegetarian: item.veg, spiciness: item.spicy }}
        />
      ))}
    </div>
  );
}

function WhyUsSection() {
  const reasons = [
    {
      icon: "🌽",
      title: "Ingredientes frescos",
      desc: "Tortillas hechas a mano cada día. Nada de conservadores.",
    },
    {
      icon: "👨‍🍳",
      title: "Recetas auténticas",
      desc: "Sabores de la abuela, directos a tu boca.",
    },
    {
      icon: "🚚",
      title: "Catering disponible",
      desc: "Llevamos el taco truck a tu evento o empresa.",
    },
  ];

  return (
    <section className="py-20" style={{ backgroundColor: "#ECFDF5" }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          className="text-4xl font-black text-center mb-14"
          style={{ color: "#1A1A1A" }}
        >
          ¿Por qué nom-nom?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reasons.map((r, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl mb-4">{r.icon}</div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: "#1A1A1A" }}
              >
                {r.title}
              </h3>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CateringSection() {
  return (
    <section
      className="py-20 relative overflow-hidden"
      style={{ backgroundColor: "#1A1A1A" }}
    >
      {/* Orange blob decorativo */}
      <div
        className="absolute -top-20 -left-20 w-80 h-60 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ backgroundColor: ORANGE }}
      />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ color: PRIMARY }}
        >
          Eventos y empresas
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
          Taco truck a domicilio
        </h2>
        <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
          Llevamos nom-nom a tu cumpleaños, boda, evento corporativo o cualquier
          reunión. Pide tu cotización.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/t/nom-nom/contact"
            className="px-8 py-4 rounded-xl font-bold text-sm transition-all hover:scale-[1.03]"
            style={{ backgroundColor: PRIMARY, color: "white" }}
          >
            Cotizar catering
          </a>
          <a
            href="/t/nom-nom#menu"
            className="px-8 py-4 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
            style={{ border: "1.5px solid rgba(255,255,255,0.3)" }}
          >
            Ver menú completo
          </a>
        </div>
      </div>
    </section>
  );
}

function InfoSection() {
  return (
    <section className="py-12 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Teléfono", value: "+1-555-0205" },
            { label: "Email", value: "pedidos@nom-nom.local" },
            {
              label: "Horario",
              value: "Lun-Mié 11-21 · Jue 11-22 · Vie-Sáb 11-23 · Dom 10-20",
            },
            { label: "Ubicación", value: "987 Food Truck Plaza, East LA, CA" },
          ].map((item) => (
            <div key={item.label}>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: PRIMARY }}
              >
                {item.label}
              </p>
              <p className="text-sm" style={{ color: "#4B5563" }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MenuSkeleton() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-48 bg-gray-100 rounded mx-auto mb-14 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden border border-gray-100 animate-pulse"
            >
              <div className="h-40 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
