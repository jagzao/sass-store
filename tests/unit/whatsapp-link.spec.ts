/**
 * Tests for WhatsApp Link Generation Utility
 *
 * Tests the WhatsApp deep-link generation with prefilled messages
 * for appointment confirmations.
 */

import {
  generateWhatsAppLink,
  generateQuickConfirmationLink,
  sanitizePhone,
  WhatsAppLinkParams,
} from "../../apps/web/lib/home/whatsapp-link";

describe("WhatsApp Link Generation", () => {
  describe("sanitizePhone", () => {
    it("should remove non-numeric characters", () => {
      expect(sanitizePhone("521234567890")).toBe("521234567890");
      expect(sanitizePhone("52-1234-567890")).toBe("521234567890");
      expect(sanitizePhone("(52) 1234-567890")).toBe("521234567890");
      expect(sanitizePhone("52 1234 567890")).toBe("521234567890");
    });

    it("should remove leading zero", () => {
      expect(sanitizePhone("0521234567890")).toBe("521234567890");
      expect(sanitizePhone("01234567890")).toBe("521234567890"); // 10-digit numbers get Mexico country code
    });

    it("should add Mexico country code for 10-digit numbers", () => {
      expect(sanitizePhone("1234567890")).toBe("521234567890");
    });

    it("should preserve existing country code", () => {
      expect(sanitizePhone("521234567890")).toBe("521234567890");
      expect(sanitizePhone("11234567890")).toBe("11234567890");
    });
  });

  describe("generateWhatsAppLink", () => {
    const baseParams: WhatsAppLinkParams = {
      phone: "521234567890",
      customerName: "María García",
      tenantName: "Wondernails",
    };

    it("should generate basic WhatsApp link", () => {
      const link = generateWhatsAppLink(baseParams);
      
      expect(link).toMatch(/^https:\/\/wa\.me\/521234567890\?text=/);
      expect(link).toContain(encodeURIComponent("María"));
      expect(link).toContain(encodeURIComponent("García"));
      expect(link).toContain(encodeURIComponent("Wondernails"));
    });

    it("should include service name when provided", () => {
      const params = { ...baseParams, serviceName: "Manicure" };
      const link = generateWhatsAppLink(params);
      
      expect(link).toContain("Manicure");
    });

    it("should include appointment date when provided", () => {
      const date = new Date("2024-03-15T10:00:00");
      const params = { ...baseParams, appointmentDate: date };
      const link = generateWhatsAppLink(params);
      
      expect(link).toContain("2024");
      expect(link).toContain("marzo");
    });

    it("should use custom message when provided", () => {
      const customMessage = "Hola, ¿podrías confirmar tu cita?";
      const params = { ...baseParams, customMessage };
      const link = generateWhatsAppLink(params);
      
      expect(link).toContain(encodeURIComponent(customMessage));
      expect(link).not.toContain("te escribimos de"); // Not using default template
    });

    it("should handle special characters in message", () => {
      const params = { ...baseParams, serviceName: "Manicure & Pedicure" };
      const link = generateWhatsAppLink(params);
      
      expect(link).toContain("Manicure");
      expect(link).toContain("Pedicure");
    });
  });

  describe("generateQuickConfirmationLink", () => {
    it("should generate simplified confirmation link", () => {
      const link = generateQuickConfirmationLink(
        "521234567890",
        "María García",
        "Wondernails"
      );
      
      expect(link).toMatch(/^https:\/\/wa\.me\/521234567890\?text=/);
      expect(link).toContain(encodeURIComponent("María"));
      expect(link).toContain(encodeURIComponent("García"));
      expect(link).toContain(encodeURIComponent("Wondernails"));
      expect(link).toContain(encodeURIComponent("confirmar"));
    });

    it("should use proper phone sanitization", () => {
      const link = generateQuickConfirmationLink(
        "52-1234-567890",
        "María García",
        "Wondernails"
      );
      
      expect(link).toContain("521234567890"); // Should be sanitized
    });
  });

  describe("URL Encoding", () => {
    it("should properly encode special characters", () => {
      const params: WhatsAppLinkParams = {
        phone: "521234567890",
        customerName: "María García López",
        tenantName: "Wondernails & Beauty",
        serviceName: "Manicure & Pedicure",
      };
      
      const link = generateWhatsAppLink(params);
      
      // Should contain encoded characters
      expect(link).toContain("%C3%AD"); // í
      expect(link).toContain("%C3%AD"); // í
      expect(link).toContain("%26"); // &
    });

    it("should handle spaces in message", () => {
      const link = generateWhatsAppLink({
        phone: "521234567890",
        customerName: "María García",
        tenantName: "Wondernails",
      });
      
      expect(link).toContain("%20"); // Space should be encoded
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty customer name", () => {
      const params: WhatsAppLinkParams = {
        phone: "521234567890",
        customerName: "",
        tenantName: "Wondernails",
      };
      
      const link = generateWhatsAppLink(params);
      expect(link).toContain("Hola");
    });

    it("should handle special characters in tenant name", () => {
      const params: WhatsAppLinkParams = {
        phone: "521234567890",
        customerName: "María",
        tenantName: "Wondernails & Co.",
      };
      
      const link = generateWhatsAppLink(params);
      expect(link).toContain("Wondernails");
      expect(link).toContain("%26"); // Encoded &
    });
  });
});