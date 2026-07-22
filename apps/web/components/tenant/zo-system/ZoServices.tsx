import Link from "next/link";
import {
  Rocket,
  CloudCog,
  Bot,
  SearchCheck,
  ArrowRight,
  Code2,
  Bug,
} from "lucide-react";

const services = [
  {
    icon: Rocket,
    name: "Desarrollo de plataformas SaaS",
    description:
      "Aplicaciones multi-tenant, portales administrativos, suscripciones, pagos, permisos, dashboards e integraciones empresariales.",
    capabilities: [
      "Multi-tenant",
      "Dashboards",
      "Pagos y suscripciones",
      "Permisos RBAC",
      "Integraciones",
    ],
  },
  {
    icon: CloudCog,
    name: "Modernización .NET y cloud",
    description:
      "Migración de sistemas heredados, construcción de APIs, microservicios, Azure, PostgreSQL, SQL Server y optimización de arquitectura.",
    capabilities: [
      "Migración .NET",
      "APIs REST",
      "Azure",
      "PostgreSQL / SQL Server",
      "Docker",
    ],
  },
  {
    icon: Code2,
    name: "Desarrollo de API y backend",
    description:
      "Diseño e implementación de APIs REST y GraphQL en .NET 8, NestJS o Node.js: autenticación, autorización RBAC, documentación OpenAPI, observabilidad y despliegue en Azure o Vercel.",
    capabilities: [
      "REST / GraphQL",
      ".NET 8 / NestJS / Node.js",
      "RBAC + JWT",
      "OpenAPI",
      "Azure / Vercel",
    ],
  },
  {
    icon: Bug,
    name: "Bug fix y feature en multi-stack",
    description:
      "Resolución de incidentes, hotfixes y desarrollo de features puntuales en aplicaciones .NET, React, Vue o Node.js existentes, con onboarding rápido y entregas cortas.",
    capabilities: [
      "Hotfixes .NET",
      "Features React / Vue",
      "Node.js maintenance",
      "Onboarding rápido",
      "Entregas cortas",
    ],
  },
  {
    icon: Bot,
    name: "Automatización e inteligencia artificial",
    description:
      "Agentes inteligentes, RAG, automatizaciones con n8n, procesamiento documental, asistentes empresariales e integración de modelos de IA.",
    capabilities: [
      "Agentes y RAG",
      "n8n",
      "Procesamiento documental",
      "Asistentes empresariales",
      "OpenAI-compatible APIs",
    ],
  },
  {
    icon: SearchCheck,
    name: "Auditoría y rescate de proyectos",
    description:
      "Revisión de arquitectura, rendimiento, seguridad, deuda técnica, calidad del código y estabilización de aplicaciones existentes.",
    capabilities: [
      "Revisión de arquitectura",
      "Performance",
      "Seguridad",
      "Deuda técnica",
      "Plan de rescate",
    ],
  },
];

export function ZoServices() {
  return (
    <section id="servicios" className="relative bg-[#070708] py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0d0e11] via-transparent to-[#0d0e11] opacity-50" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[#e8343d] uppercase tracking-wider">
            Servicios
          </p>
          <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-[#f5f5f7] leading-tight">
            Especialización concreta para proyectos empresariales
          </h2>
          <p className="mt-4 text-lg text-[#a7abb4] max-w-[54ch]">
            No ofrecemos servicios genéricos. Cada propuesta se construye sobre
            arquitectura, código mantenible y entregas medibles.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-2 gap-5">
          {services.map((service, index) => {
            const Icon = service.icon;
            const accent =
              index % 2 === 0 ? "from-[#e8343d]" : "from-[#c9a24e]";
            return (
              <article
                key={service.name}
                className="group relative rounded-xl border border-[#282a31] bg-[#111216] p-6 lg:p-7 hover:border-[#e8343d]/50 hover:bg-[#18191e] transition-all"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r ${accent} to-transparent opacity-70`}
                />
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#7d161c]/40 text-[#e8343d] border border-[#7d161c]">
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <Link
                    href="/t/zo-system/contact"
                    className="text-sm text-[#e8343d] hover:text-[#ff4650] inline-flex items-center gap-1 transition-colors"
                  >
                    Solicitar evaluación
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[#f5f5f7]">
                  {service.name}
                </h3>
                <p className="mt-2 text-[#a7abb4] leading-relaxed">
                  {service.description}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {service.capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="px-3 py-1 rounded-full bg-[#18191e] text-xs text-[#a7abb4] border border-[#282a31]"
                    >
                      {cap}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
