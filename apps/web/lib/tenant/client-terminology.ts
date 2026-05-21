/**
 * Returns tenant-specific terminology for "clients".
 * Beauty salons → "Clienta/Clientas"
 * Sports/fitness → "Alumno/Alumnos"
 * Default        → "Cliente/Clientes"
 *
 * Can be overridden via tenant_configs with key "client_terminology"
 * and value { singular, plural }.
 */

export type ClientTerms = {
  singular: string; // "Clienta" | "Alumno" | "Cliente"
  plural: string; // "Clientas" | "Alumnos" | "Clientes"
  singularLower: string;
  pluralLower: string;
  /** "Gestión de Clientas / Alumnos / Clientes" */
  managementTitle: string;
  /** "expediente de clienta / alumno / cliente" */
  fileLabel: string;
  /** "agregar nueva clienta / nuevo alumno / nuevo cliente" */
  addLabel: string;
};

const SPORTS_KEYWORDS = [
  "tenistico",
  "tenis",
  "tennis",
  "sport",
  "deportivo",
  "gym",
  "fitness",
  "futbol",
  "football",
  "basket",
  "volleyball",
];

const BEAUTY_SLUGS = [
  "wondernails",
  "vigistudio",
  "vainilla-vargas",
  "delirios",
];

function detectTenantType(tenantSlug: string): "beauty" | "sports" | "default" {
  const slug = tenantSlug.toLowerCase();
  if (BEAUTY_SLUGS.includes(slug)) return "beauty";
  if (SPORTS_KEYWORDS.some((kw) => slug.includes(kw))) return "sports";
  return "default";
}

export function getClientTerms(tenantSlug: string): ClientTerms {
  const type = detectTenantType(tenantSlug);

  if (type === "beauty") {
    return {
      singular: "Clienta",
      plural: "Clientas",
      singularLower: "clienta",
      pluralLower: "clientas",
      managementTitle: "Gestión de Clientas",
      fileLabel: "Expediente de Clienta",
      addLabel: "Agregar Clienta",
    };
  }

  if (type === "sports") {
    return {
      singular: "Alumno",
      plural: "Alumnos",
      singularLower: "alumno",
      pluralLower: "alumnos",
      managementTitle: "Gestión de Alumnos",
      fileLabel: "Expediente de Alumno",
      addLabel: "Agregar Alumno",
    };
  }

  return {
    singular: "Cliente",
    plural: "Clientes",
    singularLower: "cliente",
    pluralLower: "clientes",
    managementTitle: "Gestión de Clientes",
    fileLabel: "Expediente de Cliente",
    addLabel: "Agregar Cliente",
  };
}
