import { describe, it, expect } from "vitest";
import {
  filterServices,
  MIN_SEARCH_LENGTH,
} from "@/lib/services/services-filter";

describe("Feature: búsqueda de servicios sin error (STRY-026 SC-09/SC-10)", () => {
  const services = [
    {
      id: "1",
      name: "Manicura Premium",
      description: "Manicura completa",
      shortDescription: "Manicura",
      longDescription: "Detalle largo manicura",
    },
    {
      id: "2",
      name: "Pedicure Spa",
      description: "Tratamiento de pies",
      shortDescription: "Pedicure",
      longDescription: null,
    },
    {
      id: "3",
      name: "Corte de cabello",
      description: null,
      shortDescription: null,
      longDescription: null,
    },
  ];

  // SC-10: con < 3 caracteres no filtra
  it("SC-10 — devuelve todos con menos de 3 caracteres", () => {
    expect(filterServices(services, "").length).toBe(3);
    expect(filterServices(services, "ma").length).toBe(3);
  });

  // SC-09: con >= 3 filtra por nombre/descripciones
  it("SC-09 — filtra por nombre con 3+ caracteres", () => {
    const r = filterServices(services, "manicura");
    expect(r.length).toBe(1);
    expect(r[0].id).toBe("1");
  });

  it("filtra por shortDescription", () => {
    const r = filterServices(services, "pedicure");
    expect(r.length).toBe(1);
    expect(r[0].id).toBe("2");
  });

  it("filtra por longDescription", () => {
    const r = filterServices(services, "largo");
    expect(r.length).toBe(1);
    expect(r[0].id).toBe("1");
  });

  it("no lanza con descripciones null/undefined", () => {
    expect(() => filterServices(services, "corte")).not.toThrow();
    const r = filterServices(services, "corte");
    expect(r[0].id).toBe("3");
  });

  it("UMBRAL mínimo de búsqueda = 3", () => {
    expect(MIN_SEARCH_LENGTH).toBe(3);
  });
});
