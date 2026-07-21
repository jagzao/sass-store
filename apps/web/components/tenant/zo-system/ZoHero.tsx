"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { projects, projectAssetPath } from "./projects-data";

const heroMain = projects.find((p) => p.slug === "centro-tenistico")!;
const heroSecondary = projects.find((p) => p.slug === "wondernails")!;
const heroTertiary = projects.find((p) => p.slug === "zo-portfolio")!;

export function ZoHero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#070708] pt-28 lg:pt-36 pb-16 lg:pb-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#e8343d]/5 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[#c9a24e]/5 rounded-full blur-[100px] opacity-40" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[55%_45%] gap-12 lg:gap-10 items-center">
          <div
            className={`transition-all duration-700 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-sm font-medium text-[#e8343d] uppercase tracking-wider mb-4">
              Desarrollo de software empresarial
            </p>
            <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.05] tracking-tight text-[#f5f5f7] max-w-[18ch]">
              Software B2B que{" "}
              <span className="bg-gradient-to-r from-[#e8343d] via-[#ff4650] to-[#c9a24e] bg-clip-text text-transparent">
                automatiza
              </span>{" "}
              operaciones y escala contigo
            </h1>
            <p className="mt-6 text-lg text-[#a7abb4] leading-relaxed max-w-[54ch]">
              Desarrollamos plataformas SaaS, modernizamos aplicaciones .NET e
              integramos automatización con inteligencia artificial para
              empresas de operaciones, finanzas y servicios.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="https://calendly.com/jagzao"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-[#e8343d] text-[#f5f5f7] font-medium shadow-[0_0_0_1px_#7d161c,0_8px_24px_-10px_rgba(232,52,61,0.35)] hover:bg-[#ff4650] hover:shadow-[0_0_0_1px_#7d161c,0_12px_32px_-8px_rgba(232,52,61,0.45)] hover:-translate-y-0.5 transition-all min-h-[48px]"
              >
                Agenda una llamada
              </Link>
              <Link
                href="/t/zo-system/#casos"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg border border-[#282a31] text-[#f5f5f7] font-medium hover:bg-[#18191e] hover:border-[#a7abb4]/40 transition-all min-h-[48px]"
              >
                Ver casos reales
              </Link>
            </div>
            <p className="mt-6 text-sm text-[#737782]">
              10+ años desarrollando soluciones con .NET, React, Vue, Azure y
              PostgreSQL para equipos internacionales.
            </p>
          </div>

          <div
            className={`relative transition-all duration-700 delay-200 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <HeroComposition />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroComposition() {
  return (
    <div className="relative mx-auto lg:mx-0 w-full max-w-xl">
      <div className="relative z-10 rounded-xl overflow-hidden border border-[#282a31] bg-[#111216] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(232,52,61,0.08)]">
        <BrowserBar title={heroMain.name} />
        <ProjectImage
          slug={heroMain.slug}
          alt={`Captura de ${heroMain.name}`}
          aspect="aspect-[16/10]"
        />
      </div>

      <div className="absolute -top-4 -right-6 z-20 w-32 sm:w-40 rounded-lg overflow-hidden border border-[#282a31] bg-[#111216] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(201,162,78,0.12)] hidden sm:block">
        <BrowserBar title={heroSecondary.name} />
        <ProjectImage
          slug={heroSecondary.slug}
          alt={`Captura móvil de ${heroSecondary.name}`}
          aspect="aspect-[9/16]"
          mobile
        />
      </div>

      <div className="absolute -bottom-5 -left-6 z-20 w-40 sm:w-48 rounded-lg overflow-hidden border border-[#282a31] bg-[#111216] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(232,52,61,0.12)] hidden sm:block">
        <BrowserBar title={heroTertiary.name} />
        <ProjectImage
          slug={heroTertiary.slug}
          alt={`Captura de ${heroTertiary.name}`}
          aspect="aspect-[16/10]"
        />
      </div>

      <div className="pointer-events-none absolute -inset-10 bg-gradient-to-tr from-[#e8343d]/10 via-transparent to-[#c9a24e]/10 blur-2xl opacity-50" />
    </div>
  );
}

function ProjectImage({
  slug,
  alt,
  aspect,
  mobile = false,
}: {
  slug: string;
  alt: string;
  aspect: string;
  mobile?: boolean;
}) {
  const [error, setError] = useState(false);
  const src = projectAssetPath(
    slug,
    mobile ? "cover-mobile.webp" : "cover-desktop.webp",
  );
  return (
    <div className={`relative ${aspect} bg-[#0d0e11] overflow-hidden`}>
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-[#737782]">Imagen pendiente</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-top"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

function BrowserBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-[#18191e] border-b border-[#282a31]">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#7d161c]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#7d6839]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#282a31]" />
      </div>
      <span className="ml-2 text-[10px] text-[#737782] font-mono truncate">
        {title}
      </span>
    </div>
  );
}
