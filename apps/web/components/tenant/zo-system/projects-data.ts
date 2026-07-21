export interface Project {
  slug: string;
  name: string;
  category: string;
  type: "experience" | "platform";
  shortDescription: string;
  problem: string;
  solution: string;
  tech: string[];
  badges: string[];
  link?: string;
  anonymized?: boolean;
  hasAssets: boolean;
}

export const projects: Project[] = [
  {
    slug: "zo-portfolio",
    name: "Zo Portfolio",
    category: "Brand experience",
    type: "experience",
    shortDescription:
      "Experiencia web premium con motion design, branding y componentes visuales pulidos.",
    problem:
      "Necesidad de una presencia digital que transmita identidad, calidad visual y nivel técnico desde el primer scroll.",
    solution:
      "Diseño y desarrollo de una landing experiencial con animaciones controladas, composición visual y sistema de componentes coherente.",
    tech: ["Next.js", "React", "Tailwind", "Framer Motion", "TypeScript"],
    badges: ["Frontend Experience", "Brand Experience", "Motion"],
    link: "https://zo-portfolio.pages.dev/",
    hasAssets: true,
  },
  {
    slug: "wondernails",
    name: "WonderNails",
    category: "Frontend experience",
    type: "experience",
    shortDescription:
      "Catálogo, reservas y experiencia de marca para un negocio de manicure profesional.",
    problem:
      "La marca necesitaba una experiencia web elegante que mostrara servicios, productos y permita reservar sin fricción.",
    solution:
      "Landing premium con catálogo visual, flujo de reservas, PWA y tema de lujo adaptado al negocio.",
    tech: ["Next.js", "React", "Tailwind", "PWA", "PostgreSQL"],
    badges: ["Frontend Experience", "Booking", "Brand Experience"],
    link: "https://sass-store-web.vercel.app/t/wondernails",
    hasAssets: true,
  },
  {
    slug: "centro-tenistico",
    name: "Centro Tenístico Villafuerte",
    category: "Plataforma de reservas",
    type: "experience",
    shortDescription:
      "Reservas de canchas, clases y administración para un centro deportivo.",
    problem:
      "Gestión manual de horarios, reservas y clases que dificultaba la operación diaria y la experiencia de los usuarios.",
    solution:
      "Plataforma multi-tenant con reservas online, calendario, pagos y panel administrativo para el centro.",
    tech: ["Next.js", "React", "Tailwind", "PostgreSQL", "Reservas"],
    badges: ["Frontend Experience", "Booking", "Admin Platform"],
    link: "https://sass-store-web.vercel.app/t/centro-tenistico",
    hasAssets: true,
  },
  {
    slug: "reelflow",
    name: "ReelFlow",
    category: "Automatización de contenido",
    type: "platform",
    shortDescription:
      "Pipeline multi-tenant para ingestión, aprobación y publicación de video en redes sociales.",
    problem:
      "Proceso manual de descarga, edición, revisión, subtítulos y publicación en redes sociales. Errores frecuentes y lentitud.",
    solution:
      "Plataforma multi-tenant que automatiza el pipeline de videos: ingestión, procesamiento, aprobación, programación y publicación.",
    tech: ["React", "FastAPI", "PostgreSQL", "Redis", "Celery", "Docker"],
    badges: ["SaaS", "Multi-tenant", "Automation"],
    hasAssets: false,
  },
  {
    slug: "saas-store",
    name: "SaaS Store",
    category: "Plataforma vertical multi-tenant",
    type: "platform",
    shortDescription:
      "SaaS unificado para catálogo, ventas, reservas, inventario y administración de negocios de servicios.",
    problem:
      "Soluciones fragmentadas, altos costos de integración y dificultad para lanzar nuevos tenants rápidamente.",
    solution:
      "SaaS multi-tenant unificado con catálogo, ventas, reservas, inventario, publicaciones y administración centralizada.",
    tech: ["Nuxt", "Vue", "Cloudflare Workers", "D1", "Drizzle", "R2"],
    badges: ["SaaS", "Multi-tenant", "Admin Platform"],
    hasAssets: false,
  },
  {
    slug: "conversai",
    name: "ConversAI",
    category: "Agente inteligente multi-tenant",
    type: "platform",
    shortDescription:
      "Agente de atención con RAG que responde desde la información privada de cada negocio.",
    problem:
      "Atención manual saturada, respuestas inconsistentes y dificultad para mantener conocimiento actualizado por cliente.",
    solution:
      "Agente inteligente multi-tenant con RAG que responde desde la información privada de cada negocio, con panel de control.",
    tech: ["Python", "FastAPI", "PostgreSQL", "OpenAI", "RAG", "n8n"],
    badges: ["AI", "Multi-tenant", "Automation"],
    hasAssets: false,
  },
  {
    slug: "rbac",
    name: "Plataforma de usuarios y permisos",
    category: "Caso anonimizado · EY",
    type: "platform",
    shortDescription:
      "Microfrontend reusable para centralizar usuarios, roles y permisos en aplicaciones empresariales.",
    problem:
      "Cada aplicación gestionaba usuarios y permisos de forma independiente, generando riesgo de seguridad y sobrecarga operativa.",
    solution:
      "Microfrontend Vue distribuido como paquete NPM e instalado en diferentes aplicaciones empresariales para centralizar usuarios, roles y permisos.",
    tech: ["Vue", "TypeScript", ".NET", "Azure", "RBAC", "CI/CD"],
    badges: ["RBAC", "Microfrontend", "Enterprise"],
    anonymized: true,
    hasAssets: false,
  },
];

export function projectAssetPath(slug: string, name: string) {
  return `/tenants/zo-system/projects/${slug}/${name}`;
}
