/**
 * SentimentDetector
 *
 * Detecta tono negativo o frustración en mensajes del cliente.
 * Si el score supera el umbral, el agente escala a humano.
 */

const NEGATIVE_PATTERNS = [
  /\b(enojado|molesto|mal servicio|p[eé]simo|horrible|incre[íi]ble|queja|denuncia|fraude)\b/i,
  /\b(no\s+sirven?|muy\s+mal|muy\s+mala|terrible)\b/i,
];

export function detectNegativeSentiment(text: string): boolean {
  return NEGATIVE_PATTERNS.some((p) => p.test(text));
}
