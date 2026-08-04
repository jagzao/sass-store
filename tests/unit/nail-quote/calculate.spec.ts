import { describe, it, expect } from "vitest";
import {
  calculateNailQuote,
  formatNailQuoteDuration,
  formatNailQuotePrice,
} from "@sass-store/core/src/services/nail-quote/calculate";
import { NailQuoteOption } from "@sass-store/core/src/services/nail-quote/types";

const makeCatalog = (): NailQuoteOption[] => [
  {
    id: "mat-acrilico",
    tenantId: "t1",
    category: "material",
    key: "acrilico",
    label: "Acrilico",
    basePrice: 52000,
    baseDurationMinutes: 90,
    order: 1,
    isActive: true,
  },
  {
    id: "len-m",
    tenantId: "t1",
    category: "length",
    key: "m",
    label: "M",
    basePrice: 0,
    baseDurationMinutes: 15,
    order: 1,
    isActive: true,
  },
  {
    id: "shape-almendra",
    tenantId: "t1",
    category: "shape",
    key: "almendra",
    label: "Almendra",
    basePrice: 0,
    baseDurationMinutes: 0,
    order: 1,
    isActive: true,
  },
  {
    id: "addon-french",
    tenantId: "t1",
    category: "addon",
    key: "french",
    label: "French",
    basePrice: 5000,
    baseDurationMinutes: 15,
    order: 1,
    isActive: true,
  },
  {
    id: "addon-cristales",
    tenantId: "t1",
    category: "addon",
    key: "cristales",
    label: "Cristales",
    basePrice: 5000,
    baseDurationMinutes: 30,
    order: 2,
    isActive: true,
  },
];

describe("calculateNailQuote", () => {
  it("calcula estimado con material + largo + forma", () => {
    const result = calculateNailQuote(
      ["mat-acrilico", "len-m", "shape-almendra"],
      makeCatalog(),
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.total).toBe(52000);
    expect(result.data.durationMinutes).toBe(105);
  });

  it("suma adornos y permite quitarlos", () => {
    const withAddons = calculateNailQuote(
      [
        "mat-acrilico",
        "len-m",
        "shape-almendra",
        "addon-french",
        "addon-cristales",
      ],
      makeCatalog(),
    );
    expect(withAddons.success).toBe(true);
    if (!withAddons.success) return;
    expect(withAddons.data.total).toBe(62000);
    expect(withAddons.data.durationMinutes).toBe(150);

    const withoutOne = calculateNailQuote(
      ["mat-acrilico", "len-m", "shape-almendra", "addon-cristales"],
      makeCatalog(),
    );
    expect(withoutOne.success).toBe(true);
    if (!withoutOne.success) return;
    expect(withoutOne.data.total).toBe(57000);
    expect(withoutOne.data.durationMinutes).toBe(135);
  });

  it("falla si falta material", () => {
    const result = calculateNailQuote(
      ["len-m", "shape-almendra"],
      makeCatalog(),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.type).toBe("ValidationError");
  });

  it("falla si hay dos materiales", () => {
    const catalog = [
      ...makeCatalog(),
      {
        id: "mat-rubber",
        tenantId: "t1",
        category: "material",
        key: "rubber",
        label: "Rubber",
        basePrice: 52000,
        baseDurationMinutes: 90,
        order: 2,
        isActive: true,
      },
    ];
    const result = calculateNailQuote(
      ["mat-acrilico", "mat-rubber", "len-m", "shape-almendra"],
      catalog,
    );
    expect(result.success).toBe(false);
  });

  it("ignora opciones inactivas", () => {
    const catalog = makeCatalog().map((o) =>
      o.id === "mat-acrilico" ? { ...o, isActive: false } : o,
    );
    const result = calculateNailQuote(
      ["mat-acrilico", "len-m", "shape-almendra"],
      catalog,
    );
    expect(result.success).toBe(false);
  });
});

describe("formatNailQuoteDuration", () => {
  it("formatea minutos", () => {
    expect(formatNailQuoteDuration(0)).toBe("0 min");
    expect(formatNailQuoteDuration(15)).toBe("15 min");
    expect(formatNailQuoteDuration(60)).toBe("1 h");
    expect(formatNailQuoteDuration(75)).toBe("1 h 15 min");
  });
});

describe("formatNailQuotePrice", () => {
  it("formatea centavos", () => {
    expect(formatNailQuotePrice(52000)).toBe("$520");
    expect(formatNailQuotePrice(0)).toBe("$0");
  });
});
