import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const cases = [
  {
    name: "ReelFlow",
    category: "Automatización de contenido",
    problem:
      "Proceso manual de descarga, edición, revisión, subtítulos y publicación en redes sociales. Errores frecuentes y lentitud.",
    solution:
      "Plataforma multi-tenant que automatiza el pipeline de videos: ingestión, procesamiento, aprobación, programación y publicación.",
    tech: ["React", "FastAPI", "PostgreSQL", "Redis", "Celery", "Docker"],
    outcome:
      "Reducción del tiempo de publicación de horas a minutos con trazabilidad completa.",
    status: "En producción",
    image: "reelflow-dashboard",
  },
  {
    name: "ConversAI",
    category: "Agente inteligente multi-tenant",
    problem:
      "Atención manual saturada, respuestas inconsistentes y dificultad para mantener conocimiento actualizado por cliente.",
    solution:
      "Agente inteligente multi-tenant con RAG que responde desde la información privada de cada negocio, con panel de control.",
    tech: ["Python", "FastAPI", "PostgreSQL", "OpenAI", "RAG", "n8n"],
    outcome:
      "Respuestas automáticas con contexto de cada negocio y escalabilidad por tenant.",
    status: "Piloto activo",
    image: "conversai-widget",
  },
  {
    name: "SaaS Store",
    category: "Plataforma vertical multi-tenant",
    problem:
      "Soluciones fragmentadas, altos costos de integración y dificultad para lanzar nuevos tenants rápidamente.",
    solution:
      "SaaS multi-tenant unificado con catálogo, ventas, reservas, inventario, publicaciones y administración centralizada.",
    tech: ["Nuxt", "Vue", "Cloudflare Workers", "D1", "Drizzle", "R2"],
    outcome:
      "Lanzamiento de nuevos tenants en minutos con costos operativos reducidos.",
    status: "En producción",
    image: "saas-store-admin",
  },
  {
    name: "Plataforma de usuarios y permisos",
    category: "Caso anonimizado · EY",
    problem:
      "Cada aplicación gestionaba usuarios y permisos de forma independiente, generando riesgo de seguridad y sobrecarga operativa.",
    solution:
      "Microfrontend Vue distribuido como paquete NPM e instalado en diferentes aplicaciones empresariales para centralizar usuarios, roles y permisos.",
    tech: ["Vue", "TypeScript", ".NET", "Azure", "RBAC", "CI/CD"],
    outcome:
      "Centralización de permisos con despliegue controlado en aplicaciones críticas.",
    status: "Entregado",
    image: "rbac-microfrontend",
    anonymized: true,
  },
];

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
            multi-tenant, automatización, IA empresarial y modernización de
            sistemas.
          </p>
        </div>

        <div className="mt-16 space-y-20 lg:space-y-28">
          {cases.map((c, index) => {
            const isReversed = index % 2 === 1;
            return (
              <article
                key={c.name}
                className={`grid lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-14 items-center ${isReversed ? "lg:grid-flow-dense" : ""}`}
              >
                <div
                  className={`relative ${isReversed ? "lg:col-start-2" : ""}`}
                >
                  <CaseImage name={c.name} image={c.image} />
                </div>
                <div
                  className={`${isReversed ? "lg:col-start-1 lg:row-start-1" : ""}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-medium text-[#c9a24e] uppercase tracking-wider">
                      {c.category}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-[#f5f5f7]">
                    {c.name}
                  </h3>
                  {c.anonymized && (
                    <p className="mt-1 text-sm text-[#737782]">
                      Caso anonimizado
                    </p>
                  )}
                  <div className="mt-6 space-y-4">
                    <CaseBlock label="Problema" text={c.problem} />
                    <CaseBlock label="Solución" text={c.solution} />
                    <CaseBlock label="Resultado" text={c.outcome} />
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {c.tech.map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1 rounded-full bg-[#111216] text-xs text-[#a7abb4] border border-[#282a31]"
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
          })}
        </div>
      </div>
    </section>
  );
}

function CaseBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <span className="text-xs font-semibold text-[#f5f5f7] uppercase tracking-wider">
        {label}
      </span>
      <p className="mt-1 text-[#a7abb4] leading-relaxed">{text}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "En producción"
      ? "bg-[#111216] text-[#4ade80] border-[#14532d]"
      : status === "Entregado"
        ? "bg-[#111216] text-[#60a5fa] border-[#1e3a8a]"
        : "bg-[#111216] text-[#facc15] border-[#713f12]";
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}
    >
      {status}
    </span>
  );
}

function CaseImage({ name, image }: { name: string; image: string }) {
  return (
    <div className="relative group">
      {
        // Placeholder for real product screenshot.
        // Drop image at public/tenants/zo-system/{image}.png and replace the inner content with <img />.
      }
      <div className="relative rounded-xl overflow-hidden border border-[#282a31] bg-[#111216] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7),0_0_0_1px_rgba(40,42,49,0.8)] transition-transform duration-500 group-hover:scale-[1.01]">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#18191e] border-b border-[#282a31]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7d161c]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#7d6839]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#282a31]" />
          <span className="ml-3 text-[11px] text-[#737782] font-mono">
            {image}.png
          </span>
        </div>
        <div className="aspect-[16/10] bg-[#070708] flex items-center justify-center">
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
              Imagen real pendiente: public/tenants/zo-system/{image}.png
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -inset-4 bg-gradient-to-tr from-[#e8343d]/5 to-[#c9a24e]/5 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}
