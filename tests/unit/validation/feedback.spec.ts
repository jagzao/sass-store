import { describe, it, expect } from "vitest";
import {
  CreateFeedbackSchema,
  ListFeedbackQuerySchema,
} from "../../../packages/validation/src/feedback";

describe("feedback validation schemas", () => {
  it("CreateFeedbackSchema acepta opinion válida", () => {
    const result = CreateFeedbackSchema.safeParse({
      category: "opinion",
      message: "Me gusta el diseño nuevo",
    });
    expect(result.success).toBe(true);
  });

  it("CreateFeedbackSchema acepta problema con contexto", () => {
    const result = CreateFeedbackSchema.safeParse({
      category: "problema",
      message: "Falló el checkout en el paso final",
      route: "/checkout",
      context: { previousError: { code: 500 } },
    });
    expect(result.success).toBe(true);
  });

  it("CreateFeedbackSchema rechaza categoría inválida", () => {
    const result = CreateFeedbackSchema.safeParse({
      category: "invalid",
      message: "test message long enough",
    });
    expect(result.success).toBe(false);
  });

  it("CreateFeedbackSchema rechaza mensaje vacío", () => {
    const result = CreateFeedbackSchema.safeParse({
      category: "opinion",
      message: "",
    });
    expect(result.success).toBe(false);
  });

  it("ListFeedbackQuerySchema acepta query mínima", () => {
    const result = ListFeedbackQuerySchema.safeParse({
      tenantId: "00000000-0000-0000-0000-000000000000",
      page: 1,
      limit: 10,
    });
    expect(result.success).toBe(true);
  });

  it("ListFeedbackQuerySchema aplica defaults de paginación", () => {
    const result = ListFeedbackQuerySchema.safeParse({
      tenantId: "00000000-0000-0000-0000-000000000000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });
});
