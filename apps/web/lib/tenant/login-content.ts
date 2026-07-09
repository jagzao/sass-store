/**
 * Contenido del panel izquierdo del login, por tenant.
 * Antes estaba hardcodeado para zo-system y aparecía en todos los tenants.
 * Cada tenant tiene su headline, tagline, 3 features y cita opcional.
 * Fallback genérico si el slug no está en el mapa.
 */

export type LoginFeatureIcon = "shield" | "bolt" | "cloud";

export interface LoginFeature {
  title: string;
  description: string;
  icon: LoginFeatureIcon;
}

export interface LoginContent {
  /** Texto grande del headline (ej. "ZO SYSTEM"). Si no se define, usa el nombre del tenant. */
  headline?: string;
  tagline: string;
  features: [LoginFeature, LoginFeature, LoginFeature];
  quote?: { text: string; author: string };
}

const LOGIN_CONTENT: Record<string, LoginContent> = {
  wondernails: {
    headline: "WONDER NAILS",
    tagline:
      "Belleza que realza tu estilo y confianza en cada detalle de tus manos.",
    features: [
      {
        title: "Resultados impecables",
        description: "Manicura y diseño de uñas con acabado profesional.",
        icon: "shield",
      },
      {
        title: "Reserva en segundos",
        description: "Agenda tu cita cuando quieras, sin filas ni esperas.",
        icon: "bolt",
      },
      {
        title: "Productos premium",
        description: "Trabajamos con materiales de la más alta calidad.",
        icon: "cloud",
      },
    ],
    quote: {
      text: "La belleza comienza en el momento en que decides ser tú misma.",
      author: "Coco Chanel",
    },
  },

  "centro-tenistico": {
    headline: "CENTRO TENÍSTICO",
    tagline: "Tu mejor juego empieza aquí, en cada golpe y cada partido.",
    features: [
      {
        title: "Canchas profesionales",
        description: "Superficies de primera para entrenar y competir.",
        icon: "shield",
      },
      {
        title: "Reserva fácil",
        description: "Aparta tu cancha en minutos, disponible 24/7.",
        icon: "bolt",
      },
      {
        title: "Comunidad activa",
        description: "Clases, torneos y jugadores de tu nivel.",
        icon: "cloud",
      },
    ],
    quote: {
      text: "Tienes que creer en ti cuando nadie más lo hace.",
      author: "Serena Williams",
    },
  },

  "manada-juma": {
    headline: "MANADA JUMA",
    tagline: "Aventura y bienestar al aire libre para desconectar y recargar.",
    features: [
      {
        title: "Experiencias únicas",
        description: "Actividades al aire libre diseñadas para ti.",
        icon: "shield",
      },
      {
        title: "Reserva simple",
        description: "Aparta tu aventura en línea, sin complicaciones.",
        icon: "bolt",
      },
      {
        title: "Naturaleza y salud",
        description: "Conecta con el entorno y mejora tu bienestar.",
        icon: "cloud",
      },
    ],
    quote: {
      text: "Mira profundamente en la naturaleza y entenderás todo mejor.",
      author: "Albert Einstein",
    },
  },

  "zo-system": {
    headline: "ZO SYSTEM",
    tagline:
      "Soluciones tecnológicas diseñadas para impulsar tu productividad y hacer crecer tu negocio.",
    features: [
      {
        title: "Seguro y confiable",
        description: "Protegemos tu información con los más altos estándares.",
        icon: "shield",
      },
      {
        title: "Rápido y eficiente",
        description: "Accede a tus herramientas en segundos.",
        icon: "bolt",
      },
      {
        title: "Siempre disponible",
        description: "Plataforma en la nube 24/7 desde cualquier dispositivo.",
        icon: "cloud",
      },
    ],
    quote: {
      text: "La tecnología es mejor cuando reúne a las personas.",
      author: "Matt Mullenweg",
    },
  },
};

const GENERIC_CONTENT: LoginContent = {
  tagline: "Tu plataforma de confianza para reservar y comprar en línea.",
  features: [
    {
      title: "Seguro y confiable",
      description: "Tus datos protegidos en cada operación.",
      icon: "shield",
    },
    {
      title: "Rápido y eficiente",
      description: "Reserva y compra en segundos.",
      icon: "bolt",
    },
    {
      title: "Siempre disponible",
      description: "Accede desde cualquier dispositivo, 24/7.",
      icon: "cloud",
    },
  ],
};

/**
 * Devuelve el contenido del login para un tenant.
 * Si el slug no tiene copy propio, usa el genérico + el nombre del tenant.
 */
export function getLoginContent(
  slug: string,
  tenantName: string,
): LoginContent {
  const specific = LOGIN_CONTENT[slug];
  if (specific) {
    return {
      ...specific,
      headline: specific.headline ?? tenantName,
    };
  }
  return {
    ...GENERIC_CONTENT,
    headline: tenantName,
  };
}

/** Letra inicial del nombre del tenant para el logo circular (antes era "Z" hardcodeado). */
export function getTenantInitial(name: string): string {
  return (name?.trim()?.[0] || "?").toUpperCase();
}
