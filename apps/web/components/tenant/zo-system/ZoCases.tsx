"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { projects, projectAssetPath, type Project } from "./projects-data";

const platformProjects = projects.filter((p) => p.type === "platform");
const experienceProjects = projects.filter((p) => p.type === "experience");

export function ZoCases() {
  return (
    <section id="casos" className="relative bg-[#0d0e11] py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a24e]/30 to-transparent" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[#e8343d] uppercase tracking-wider">
            Casos de éxito
          </p>
          <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-[#f5f5f7] leading-tight">
            Proyectos reales, arquitecturas reales
          </h2>
          <p className="mt-4 text-lg text-[#a7abb4] max-w-[54ch]">
            Estos proyectos reflejan el tipo de desafíos que resolvemos: SaaS
            multi-tenant, automatización, IA empresarial, interfaces premium y
            productos con fuerte componente visual.
          </p>
        </div>

        <div className="mt-16 space-y-24 lg:space-y-32">
          <ProjectGroup
            title="Experiencias y productos visuales"
            items={experienceProjects}
          />
          <ProjectGroup
            title="Plataformas y sistemas empresariales"
            items={platformProjects}
          />
        </div>
      </div>
    </section>
  );
}

function ProjectGroup({ title, items }: { title: string; items: Project[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#c9a24e] uppercase tracking-wider mb-10 border-b border-[#282a31] pb-3">
        {title}
      </h3>
      <div className="space-y-20 lg:space-y-28">
        {items.map((project, index) => (
          <CaseBlock key={project.slug} project={project} index={index} />
        ))}
      </div>
    </div>
  );
}

function CaseBlock({ project, index }: { project: Project; index: number }) {
  const isReversed = index % 2 === 1;
  return (
    <article
      className={`grid lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-14 items-center ${isReversed ? "lg:grid-flow-dense" : ""}`}
    >
      <div className={`relative ${isReversed ? "lg:col-start-2" : ""}`}>
        <CaseMedia project={project} />
      </div>

      <div className={`${isReversed ? "lg:col-start-1 lg:row-start-1" : ""}`}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-medium text-[#c9a24e] uppercase tracking-wider">
            {project.category}
          </span>
          {project.anonymized && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#111216] text-[#737782] border border-[#282a31]">
              Caso anonimizado
            </span>
          )}
        </div>

        <h3 className="text-2xl sm:text-3xl font-semibold text-[#f5f5f7]">
          {project.name}
        </h3>

        <p className="mt-3 text-[#a7abb4] leading-relaxed">
          {project.shortDescription}
        </p>

        <div className="mt-5 space-y-3">
          <CaseLine label="Enfoque" text={project.solution} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {project.badges.map((badge) => (
            <span
              key={badge}
              className="px-2.5 py-1 rounded-full bg-[#111216] text-xs text-[#a7abb4] border border-[#282a31]"
            >
              {badge}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {project.tech.map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 rounded-full bg-[#18191e] text-xs text-[#737782] border border-[#282a31]"
            >
              {t}
            </span>
          ))}
        </div>

        <Link
          href="/t/zo-system/contact"
          className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-[#e8343d] hover:text-[#ff4650] transition-colors"
        >
          Conocer más sobre este proyecto
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
}

function CaseLine({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <span className="text-xs font-semibold text-[#f5f5f7] uppercase tracking-wider">
        {label}
      </span>
      <p className="mt-1 text-sm text-[#a7abb4] leading-relaxed">{text}</p>
    </div>
  );
}

function CaseMedia({ project }: { project: Project }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // ponytail: autoplay on visibility (IntersectionObserver) en lugar de hover.
  // Loop continuo mientras esté en viewport.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView) {
      video.currentTime = 0;
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView]);

  if (!project.hasAssets) {
    return (
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border border-[#282a31] bg-[#111216] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7),0_0_0_1px_rgba(40,42,49,0.8)]"
      >
        <BrowserBar title={project.name} />
        <div className="aspect-[16/10] bg-[#070708] flex items-center justify-center">
          <ProjectAnimation slug={project.slug} name={project.name} />
        </div>
      </div>
    );
  }

  const poster = projectAssetPath(project.slug, "poster.webp");
  const videoWebm = projectAssetPath(project.slug, "preview.webm");
  const videoMp4 = projectAssetPath(project.slug, "preview.mp4");

  return (
    <div
      ref={containerRef}
      className="relative group rounded-xl overflow-hidden border border-[#282a31] bg-[#111216] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7),0_0_0_1px_rgba(40,42,49,0.8)]"
    >
      <BrowserBar title={project.name} />

      <div className="relative aspect-[16/10] bg-[#070708] overflow-hidden">
        <img
          src={poster}
          alt={`Captura de ${project.name}`}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ${inView ? "opacity-0" : "opacity-100"}`}
        />

        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ${inView ? "opacity-100" : "opacity-0"}`}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={videoWebm} type="video/webm" />
          <source src={videoMp4} type="video/mp4" />
        </video>

        <div
          className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#070708]/80 border border-[#282a31] text-[#a7abb4] text-xs backdrop-blur-sm transition-opacity duration-300 ${inView ? "opacity-0" : "opacity-100"}`}
        >
          <Play className="w-3 h-3" />
          Autoplay
        </div>

        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-10"
            aria-label={`Ver sitio de ${project.name}`}
          />
        )}
      </div>

      <div className="pointer-events-none absolute -inset-4 bg-gradient-to-tr from-[#e8343d]/5 to-[#c9a24e]/5 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}

/**
 * Animaciones CSS/SVG personalizadas para proyectos sin assets audiovisuales.
 * Cada slug recibe una animación que representa visualmente qué hace el producto.
 */
function ProjectAnimation({ slug, name }: { slug: string; name: string }) {
  if (slug === "reelflow") return <ReelFlowAnimation />;
  if (slug === "rbac") return <RbacAnimation />;
  // fallback genérico para futuros proyectos sin assets
  return (
    <div className="text-center px-8">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#e8343d]/10 text-[#e8343d] mb-4">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      </div>
      <div className="text-base font-medium text-[#a7abb4]">{name}</div>
      <div className="text-sm text-[#737782] mt-2">
        Visual del producto en preparación
      </div>
    </div>
  );
}

/**
 * ReelFlow: pipeline de video (ingesta → proceso → aprobación → publish).
 * Cuatro tarjetas fluyen en loop de izquierda a derecha con iconos.
 */
function ReelFlowAnimation() {
  const stages = [
    { label: "Ingesta", color: "#e8343d", icon: "📥" },
    { label: "Proceso", color: "#c9a24e", icon: "🎬" },
    { label: "Aprobación", color: "#3b82f6", icon: "✅" },
    { label: "Publicación", color: "#22c55e", icon: "🚀" },
  ];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-6 relative">
      <div className="text-xs font-mono uppercase tracking-wider text-[#737782]">
        Pipeline automatizado
      </div>
      <div className="relative w-full max-w-md flex items-center justify-between">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex flex-col items-center gap-2">
            <div
              className="w-12 h-12 rounded-lg border flex items-center justify-center text-lg"
              style={{
                borderColor: `${stage.color}40`,
                background: `${stage.color}10`,
                animation: `zo-pulse 2s ease-in-out ${i * 0.3}s infinite`,
              }}
            >
              {stage.icon}
            </div>
            <span className="text-[10px] text-[#a7abb4] font-medium">
              {stage.label}
            </span>
          </div>
        ))}
        {/* Línea conectora con flujo */}
        <div className="absolute top-6 left-12 right-12 h-px bg-gradient-to-r from-[#e8343d]/30 via-[#c9a24e]/30 to-[#22c55e]/30" />
        <div className="absolute top-[23px] left-12 w-2 h-2 rounded-full bg-[#e8343d] shadow-[0_0_8px_#e8343d] [animation:zo-flow_3s_linear_infinite]" />
      </div>
      <style>{`
        @keyframes zo-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes zo-flow {
          0% { left: 12%; }
          100% { left: calc(100% - 48px); }
        }
      `}</style>
    </div>
  );
}

/**
 * RBAC: matriz usuarios × roles × permisos con checks apareciendo.
 */
function RbacAnimation() {
  const roles = ["Admin", "Editor", "Viewer", "Guest"];
  const perms = ["users.read", "users.write", "billing", "deploy"];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-3">
      <div className="text-xs font-mono uppercase tracking-wider text-[#737782] mb-2">
        Matriz de permisos centralizada
      </div>
      <div className="grid grid-cols-[auto_repeat(4,1fr)] gap-1.5 text-[10px] max-w-md w-full">
        <div />
        {roles.map((r) => (
          <div
            key={r}
            className="text-center font-semibold text-[#c9a24e] py-1"
          >
            {r}
          </div>
        ))}
        {perms.map((perm, ri) => (
          <Fragment key={perm}>
            <div className="text-right pr-2 text-[#a7abb4] font-mono py-1.5">
              {perm}
            </div>
            {roles.map((_, ci) => {
              const allowed =
                (ri === 0 && ci <= 3) ||
                (ri === 1 && ci <= 1) ||
                (ri === 2 && ci === 0) ||
                (ri === 3 && ci === 0);
              return (
                <div
                  key={`${perm}-${ci}`}
                  className="flex items-center justify-center py-1.5"
                  style={{
                    animation: `zo-check 2s ease-in-out ${(ri * 4 + ci) * 0.08}s infinite`,
                  }}
                >
                  <span
                    className={`w-3 h-3 rounded-sm border ${allowed ? "bg-[#22c55e] border-[#22c55e]" : "border-[#282a31] bg-[#111216]"}`}
                  />
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
      <style>{`
        @keyframes zo-check {
          0%, 70%, 100% { opacity: 0.5; transform: scale(1); }
          35% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

function BrowserBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-[#18191e] border-b border-[#282a31]">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#7d161c]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#7d6839]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#282a31]" />
      </div>
      <span className="ml-3 text-[11px] text-[#737782] font-mono truncate">
        {title}
      </span>
    </div>
  );
}
