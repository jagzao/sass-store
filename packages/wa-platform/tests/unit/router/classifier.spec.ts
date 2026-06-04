import { describe, it, expect } from "vitest";
import { IntentClassifier } from "../../../src/router/classifier";

const classifier = new IntentClassifier();

describe("IntentClassifier", () => {
  describe("booking_start", () => {
    it.each([
      "haz cita",
      "quiero hacer una cita",
      "necesito agendar",
      "quiero reservar",
    ])('detecta booking_start en "%s"', (text) => {
      const result = classifier.classify(text);
      expect(result.type).toBe("booking_start");
      expect(result.confidence).toBeGreaterThan(0.85);
    });
  });

  describe("availability_query", () => {
    it.each([
      "¿tienen hora mañana?",
      "hay disponibilidad el jueves",
      "qué días tienen disponible",
      "para cuándo hay citas",
    ])('detecta availability_query en "%s"', (text) => {
      const result = classifier.classify(text);
      expect(result.type).toBe("availability_query");
    });
  });

  describe("confirm_yes / confirm_no via button payload", () => {
    it("clasifica confirmar como confirm_yes con confidence 1.0", () => {
      const result = classifier.classify("", "confirmar");
      expect(result.type).toBe("confirm_yes");
      expect(result.confidence).toBe(1.0);
    });

    it("clasifica cancelar como confirm_no con confidence 1.0", () => {
      const result = classifier.classify("", "cancelar");
      expect(result.type).toBe("confirm_no");
      expect(result.confidence).toBe(1.0);
    });
  });

  describe("entity extraction", () => {
    it("extrae fecha relativa 'mañana'", () => {
      const result = classifier.classify("haz cita mañana a las 3pm");
      expect(result.entities.dateRelative).toBe("mañana");
      expect(result.entities.dateIso).toBeDefined();
    });

    it("extrae hora en formato 12h", () => {
      const result = classifier.classify("quiero a las 3pm");
      expect(result.entities.timeStr).toBe("15:00");
    });

    it("extrae servicio 'manicure'", () => {
      const result = classifier.classify("haz cita de manicure");
      expect(result.entities.service).toBe("manicure");
    });
  });

  describe("unknown", () => {
    it("retorna unknown para mensaje sin intent claro", () => {
      const result = classifier.classify("ok gracias");
      expect(result.type).toBe("unknown");
      expect(result.confidence).toBe(0.0);
    });
  });
});
