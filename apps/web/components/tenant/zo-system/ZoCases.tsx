import { ArrowUpRight, Layers, Bot, Store, ShieldCheck } from "lucide-react";

const cases = [
  {
    icon: Layers,
    name: "ReelFlow",
    context:
      "Empresa de marketing que necesitaba procesar, revisar y publicar cientos de videos cortos por semana para múltiples marcas.",
    problem:
      "Proceso manual de descarga, edición, revisión, subtítulos y publicación en redes sociales. Errores frecuentes y lentitud.",
    solution:
      "Plataforma multi-tenant que automatiza el pipeline de videos: ingestión, procesamiento, aprobación, programación y publicación.",
    responsibilities: [
      "Arquitectura multi-tenant",
      "Pipeline de procesamiento de video",
      "Colas y workers con Celery",
      "Panel de administración",
      "Observabilidad",
    ],
    tech: [
      "React",
      "FastAPI",
      "PostgreSQL",
      "Redis",
      "Celery",
      "Docker",
      "Prometheus",
      "Grafana",
    ],
    outcome:
      "Reducción del tiempo de publicación de horas a minutos con trazabilidad completa.",
    status: "En producción",
  },
  {
    icon: Bot,
    name: "ConversAI",
    context:
      "Empresa de servicios que recibía consultas repetitivas por web y WhatsApp y necesitaba respuestas personalizadas por negocio.",
    problem:
      "Atención manual saturada, respuestas inconsistentes y dificultad para mantener conocimiento actualizado por cliente.",
    solution:
      "Agente inteligente multi-tenant con RAG que responde desde la información privada de cada negocio, con panel de control.",
    responsibilities: [
      "Diseño de arquitectura RAG",
      "Integración multi-tenant",
      "Conector de WhatsApp",
      "Panel administrativo",
      "Embeddings y retrieval",
    ],
    tech: [
      "Python",
      "FastAPI",
      "PostgreSQL",
      "OpenAI-compatible API",
      "RAG",
      "n8n",
    ],
    outcome:
      "Respuestas automáticas con contexto de cada negocio y escalabilidad por tenant.",
    status: "Piloto activo",
  },
  {
    icon: Store,
    name: "SaaS Store",
    context:
      "Plataforma vertical para negocios de servicios que necesitan catálogo, reservas, inventario, publicaciones y administración.",
    problem:
      "Soluciones fragmentadas, altos costos de integración y dificultad para lanzar nuevos tenants rápidamente.",
    solution:
      "SaaS multi-tenant unificado con catálogo, ventas, reservas, inventario, publicaciones y administración centralizada.",
    responsibilities: [
      "Arquitectura multi-tenant",
      "Catálogo y reservas",
      "Inventario",
      "Publicaciones automatizadas",
      "Panel administrativo",
    ],
    tech: [
      "Nuxt",
      "Vue",
      "TypeScript",
      "Cloudflare Workers",
      "D1",
      "Drizzle",
      "R2",
      "KV",
    ],
    outcome:
      "Lanzamiento de nuevos tenants en minutos con costos operativos reducidos.",
    status: "En producción",
  },
  {
    icon: ShieldCheck,
    name: "Plataforma de usuarios y permisos",
    context:
      "Caso anonimizado basado en el proyecto para EY. Empresa internacional con múltiples aplicaciones empresariales y duplicidad de control de accesos.",
    problem:
      "Cada aplicación gestionaba usuarios y permisos de forma independiente, generando riesgo de seguridad y sobrecarga operativa.",
    solution:
      "Microfrontend Vue distribuido como paquete NPM e instalado en diferentes aplicaciones empresariales para centralizar usuarios, roles y permisos.",
    responsibilities: [
      "Diseño de RBAC",
      "Microfrontend reusable",
      "Integración con .NET",
      "Azure DevOps",
      "CI/CD",
    ],
    tech: [
      "Vue",
      "TypeScript",
      ".NET",
      "Azure",
      "RBAC",
      "Microservicios",
      "CI/CD",
    ],
    outcome:
      "Centralización de permisos con despliegue controlado en aplicaciones críticas.",
    status: "Entregado",
    anonymized: true,
  },
];

export function ZoCases() {
  return (
    <section id="casos" className="bg-[#0E0E0E] py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[#DC2626] uppercase tracking-wider">
            Casos de éxito
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Proyectos reales, arquitecturas reales
          </h2>
          <p className="mt-4 text-gray-400">
            Estos proyectos reflejan el tipo de desafíos que resolvemos: SaaS
            multi-tenant, automatización, IA empresarial y modernización de
            sistemas.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {cases.map((c) => {
            const Icon = c.icon;
            return (
              <article
                key={c.name}
                className="rounded-xl border border-white/10 bg-[#111111] overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white">
                        {c.name}
                      </h3>
                      {c.anonymized && (
                        <span className="text-xs text-gray-500">
                          Caso anonimizado
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        c.status === "En producción"
                          ? "bg-green-500/10 text-green-400"
                          : c.status === "Entregado"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="mt-5 space-y-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-300">
                        Contexto:
                      </span>{" "}
                      <span className="text-gray-400">{c.context}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-300">
                        Problema:
                      </span>{" "}
                      <span className="text-gray-400">{c.problem}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-300">
                        Solución:
                      </span>{" "}
                      <span className="text-gray-400">{c.solution}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-300">
                        Responsabilidades:
                      </span>{" "}
                      <span className="text-gray-400">
                        {c.responsibilities.join(" · ")}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-300">
                        Resultado:
                      </span>{" "}
                      <span className="text-gray-400">{c.outcome}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {c.tech.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-1 rounded bg-white/5 text-xs text-gray-400 border border-white/5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
