/** Tipos de intent que el router puede clasificar */
export type IntentType =
  | "booking_start" // "haz cita", "quiero agendar"
  | "availability_query" // "¿tienen hora?", "disponibilidad"
  | "pricing_query" // "¿cuánto cuesta?"
  | "hours_query" // "¿a qué hora abren?"
  | "location_query" // "¿dónde están?"
  | "confirm_yes" // botón ✅ o "sí", "dale"
  | "confirm_no" // botón ❌ o "no", "cancelar"
  | "human_request" // "hablar con alguien"
  | "campaign_reply" // reply a una campaña activa
  | "support_query" // pregunta libre
  | "unknown"; // no se pudo clasificar

export interface ClassifiedIntent {
  type: IntentType;
  confidence: number; // 0.0–1.0
  entities: IntentEntities;
  rawText: string;
}

export interface IntentEntities {
  service?: string; // "manicure", "gel"
  dateIso?: string; // "2026-06-06"
  timeStr?: string; // "15:00"
  dateRelative?: string; // "mañana", "el martes"
}
