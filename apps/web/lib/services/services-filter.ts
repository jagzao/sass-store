/**
 * STRY-026 — Filtro de búsqueda de servicios (lógica pura).
 * Extraído del componente admin_services para ser testeable (SC-09/SC-10).
 * El filtro solo activa con >=3 caracteres (coincide con el comportamiento UI).
 */

export interface SearchableService {
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
}

export const MIN_SEARCH_LENGTH = 3;

export function filterServices<T extends SearchableService>(
  services: T[],
  searchTerm: string,
): T[] {
  if (!searchTerm || searchTerm.length < MIN_SEARCH_LENGTH) {
    return services;
  }
  const lower = searchTerm.toLowerCase();
  return services.filter((s) => {
    return (
      s.name.toLowerCase().includes(lower) ||
      (s.description?.toLowerCase() || "").includes(lower) ||
      (s.shortDescription?.toLowerCase() || "").includes(lower) ||
      (s.longDescription?.toLowerCase() || "").includes(lower)
    );
  });
}
