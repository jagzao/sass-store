import {
  buildWhatsAppMessage,
  extractCustomerFromPayload,
  normalizeQuoteDisplayItems,
  normalizeWhatsAppPhone,
  shouldSyncVisitToBookings,
} from "../../apps/web/lib/customers/visit-utils";
import { expectFailure, expectSuccess } from "@sass-store/core/src/result";

describe("visit-utils", () => {
  describe("normalizeWhatsAppPhone", () => {
    it("normalizes local MX 10-digit phones to 52 prefix", () => {
      expect(normalizeWhatsAppPhone("55 1234 5678")).toBe("525512345678");
    });

    it("keeps numbers already in 521 format", () => {
      expect(normalizeWhatsAppPhone("5215512345678")).toBe("5215512345678");
    });

    it("returns empty string when phone has no digits", () => {
      expect(normalizeWhatsAppPhone("(---) ---")).toBe("");
    });
  });

  describe("extractCustomerFromPayload", () => {
    it("extracts customer from nested payload.customer", () => {
      const payload = {
        customer: {
          id: "customer-1",
          name: "Ana",
          email: "ana@test.com",
          phone: "5512345678",
        },
      };

      expect(extractCustomerFromPayload(payload)).toEqual({
        id: "customer-1",
        name: "Ana",
        email: "ana@test.com",
        phone: "5512345678",
      });
    });

    it("extracts customer when payload itself is customer object", () => {
      const payload = {
        id: "customer-2",
        name: "Luz",
        email: "luz@test.com",
        phone: "5587654321",
      };

      expect(extractCustomerFromPayload(payload)).toEqual(payload);
    });

    it("returns null for empty payload", () => {
      expect(extractCustomerFromPayload(null)).toBeNull();
      expect(extractCustomerFromPayload(undefined)).toBeNull();
    });
  });

  describe("buildWhatsAppMessage", () => {
    it("returns successful message when there are services/products", () => {
      const result = buildWhatsAppMessage(
        "Ana",
        [
          {
            serviceId: "service-1",
            serviceName: "Manicure",
            quantity: 1,
            unitPrice: 250,
          },
        ],
        [
          {
            productId: "product-1",
            productName: "Esmalte",
            quantity: 1,
            unitPrice: 120,
          },
        ],
        370,
      );

      const message = expectSuccess(result);
      expect(message).toContain("Hola Ana");
      expect(message).toContain("Manicure");
      expect(message).toContain("Esmalte");
      expect(message).toContain("$370.00");
    });

    it("returns ValidationError when no items are provided", () => {
      const result = buildWhatsAppMessage("Ana", [], [], 0);

      const error = expectFailure(result);
      expect(error).toMatchObject({
        type: "ValidationError",
      });
    });
  });

  describe("shouldSyncVisitToBookings", () => {
    it("returns true for non-cancelled statuses", () => {
      expect(shouldSyncVisitToBookings("scheduled")).toBe(true);
      expect(shouldSyncVisitToBookings("pending")).toBe(true);
      expect(shouldSyncVisitToBookings("completed")).toBe(true);
    });

    it("returns false for cancelled status", () => {
      expect(shouldSyncVisitToBookings("cancelled")).toBe(false);
    });
  });

  describe("normalizeQuoteDisplayItems", () => {
    it("returns empty array when items are missing", () => {
      expect(normalizeQuoteDisplayItems(undefined)).toEqual([]);
      expect(normalizeQuoteDisplayItems(null)).toEqual([]);
    });

    it("normalizes quantity/unitPrice into strings", () => {
      const normalized = normalizeQuoteDisplayItems([
        {
          name: "Servicio",
          quantity: 2,
          unitPrice: 350,
        },
      ]);

      expect(normalized).toEqual([
        {
          name: "Servicio",
          quantity: "2",
          unitPrice: "350",
        },
      ]);
    });

    it("applies safe defaults for incomplete items", () => {
      const normalized = normalizeQuoteDisplayItems([
        {
          name: undefined,
          quantity: undefined,
          unitPrice: undefined,
        },
      ]);

      expect(normalized).toEqual([
        {
          name: "Item",
          quantity: "1",
          unitPrice: "0",
        },
      ]);
    });
  });
});
