import Link from "next/link";
import { Rocket, CloudCog, Bot, SearchCheck, ArrowRight } from "lucide-react";

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
    <section id="servicios" className="bg-[#0A0A0A] py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[#DC2626] uppercase tracking-wider">
            Servicios
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Especialización concreta para proyectos empresariales
          </h2>
          <p className="mt-4 text-gray-400">
            No ofrecemos servicios genéricos. Cada propuesta se construye sobre
            arquitectura, código mantenible y entregas medibles.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.name}
                className="group rounded-xl border border-white/10 bg-[#111111] p-6 hover:border-[#DC2626]/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#DC2626]/10 text-[#DC2626]">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <Link
                    href="/t/zo-system/contact"
                    className="text-sm text-[#DC2626] hover:text-white inline-flex items-center gap-1 transition-colors"
                  >
                    Solicitar evaluación
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">
                  {service.name}
                </h3>
                <p className="mt-2 text-gray-400 text-sm leading-relaxed">
                  {service.description}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {service.capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="px-2 py-1 rounded bg-white/5 text-xs text-gray-400 border border-white/5"
                    >
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
