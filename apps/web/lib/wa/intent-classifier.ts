/**
 * WA Intent Classifier — integración Next.js
 *
 * Clasifica el intent de un mensaje de WhatsApp entrante.
 * Retorna un IntentType con confidence score 0–1.
 * Alta confianza (>0.85) → respuesta determinista.
 * Baja confianza (<0.5) → Kimi K2.5 full context.
 */

export type IntentType =
  | "booking_start"
  | "availability_query"
  | "pricing_query"
  | "hours_query"
  | "location_query"
  | "confirm_yes"
  | "confirm_no"
  | "human_request"
  | "campaign_reply"
  | "support_query"
  | "unknown";

export interface ClassifiedIntent {
  type: IntentType;
  confidence: number;
  entities: {
    service?: string;
    dateIso?: string;
    timeStr?: string;
    dateRelative?: string;
  };
  rawText: string;
}

const PATTERNS: Array<{
  intent: IntentType;
  patterns: RegExp[];
  confidence: number;
}> = [
  {
    intent: "booking_start",
    patterns: [
      /\b(haz|hacer|quiero|necesito|quisiera)\s+(una?\s+)?cita\b/i,
      /\bagendar?\b/i,
      /\breservar?\b/i,
      /\bprogramar?\s+(una?\s+)?cita\b/i,
    ],
    confidence: 0.95,
  },
  {
    intent: "availability_query",
    patterns: [
      /\b(tienen?|hay)\s+(hora|cita|lugar|espacio|disponibilidad)\b/i,
      /\bdisponibilidad\b/i,
      /\bqu[eé]\s+d[ií]as\b/i,
      /\bcu[aá]ndo\s+(pueden?|tienen?|hay)\b/i,
      /\b(para\s+cu[aá]ndo|a\s+qu[eé]\s+hora)\b/i,
    ],
    confidence: 0.9,
  },
  {
    intent: "pricing_query",
    patterns: [
      /\b(cu[aá]nto\s+cuesta|precio|cobran?|vale)\b/i,
      /\bcu[aá]nto\s+(es|est[aá])\b/i,
    ],
    confidence: 0.92,
  },
  {
    intent: "hours_query",
    patterns: [
      /\b(horario|a\s+qu[eé]\s+hora\s+abren?|hasta\s+cu[aá]ndo|abren?|cierran?)\b/i,
    ],
    confidence: 0.9,
  },
  {
    intent: "location_query",
    patterns: [
      /\b(d[oó]nde\s+est[aá]n?|direcci[oó]n|c[oó]mo\s+(llego|llegar))\b/i,
    ],
    confidence: 0.9,
  },
  {
    intent: "confirm_yes",
    patterns: [
      /^(s[ií]|dale|va|confirmar?|perfecto|listo|ok|okay|si\s+quiero|de\s+acuerdo)\s*[.!]?$/i,
    ],
    confidence: 0.95,
  },
  {
    intent: "confirm_no",
    patterns: [/^(no|cancelar?|mejor\s+no|nope|nel|para|ya\s+no)\s*[.!]?$/i],
    confidence: 0.95,
  },
  {
    intent: "human_request",
    patterns: [
      /\b(hablar?\s+con\s+(alguien|una?\s+persona|humano)|persona\s+real|no\s+quiero\s+(bot|robot))\b/i,
    ],
    confidence: 0.98,
  },
];

const SERVICE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bmanicure\b/i, label: "manicure" },
  { pattern: /\bpedicure\b/i, label: "pedicure" },
  { pattern: /\bu[ñn]as?\b/i, label: "uñas" },
  { pattern: /\bgel\b/i, label: "gel" },
  { pattern: /\bacr[ií]lico\b/i, label: "acrílico" },
  { pattern: /\bsemipermanente\b/i, label: "semipermanente" },
  { pattern: /\bbaby\s+boomer\b/i, label: "baby boomer" },
  { pattern: /\bdise[ñn]o\b/i, label: "diseño" },
  { pattern: /\bnail\s+art\b/i, label: "nail art" },
  { pattern: /\bretoque\b/i, label: "retoque" },
];

export function classifyIntent(
  text: string,
  buttonPayload?: string,
): ClassifiedIntent {
  // Botones interactivos → máxima confianza
  if (buttonPayload === "confirmar") {
    return {
      type: "confirm_yes",
      confidence: 1.0,
      entities: {},
      rawText: text,
    };
  }
  if (buttonPayload === "cancelar") {
    return { type: "confirm_no", confidence: 1.0, entities: {}, rawText: text };
  }

  const normalized = text.toLowerCase().trim();

  for (const { intent, patterns, confidence } of PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return {
          type: intent,
          confidence,
          entities: extractEntities(normalized),
          rawText: text,
        };
      }
    }
  }

  return {
    type: "unknown",
    confidence: 0.0,
    entities: extractEntities(normalized),
    rawText: text,
  };
}

function extractEntities(text: string): ClassifiedIntent["entities"] {
  const entities: ClassifiedIntent["entities"] = {};
  const now = new Date();

  // Fecha relativa
  if (/\bma[ñn]ana\b/.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    entities.dateIso = d.toISOString().slice(0, 10);
    entities.dateRelative = "mañana";
  } else if (/\bhoy\b/.test(text)) {
    entities.dateIso = now.toISOString().slice(0, 10);
    entities.dateRelative = "hoy";
  } else {
    const weekdays = [
      "domingo",
      "lunes",
      "martes",
      "mi[eé]rcoles",
      "jueves",
      "viernes",
      "s[aá]bado",
    ];
    for (let i = 0; i < weekdays.length; i++) {
      if (new RegExp(`\\b${weekdays[i]}\\b`).test(text)) {
        const d = new Date(now);
        const diff = (i - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + diff);
        entities.dateIso = d.toISOString().slice(0, 10);
        break;
      }
    }
  }

  // Hora
  const timeMatch = text.match(/\b(\d{1,2})(:\d{2})?\s*(am|pm|hrs?)?\b/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = timeMatch[2] ? timeMatch[2].slice(1) : "00";
    const meridiem = timeMatch[3]?.toLowerCase();
    if (meridiem === "pm" && h < 12) h += 12;
    if (meridiem === "am" && h === 12) h = 0;
    entities.timeStr = `${h.toString().padStart(2, "0")}:${m}`;
  }

  // Servicio
  for (const { pattern, label } of SERVICE_PATTERNS) {
    if (pattern.test(text)) {
      entities.service = label;
      break;
    }
  }

  return entities;
}
