import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export interface VisitCustomerContact {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface QuoteDisplayItem {
  name: string;
  quantity: string;
  unitPrice: string;
}

export const shouldSyncVisitToBookings = (status: string): boolean =>
  status !== "cancelled";

export const normalizeWhatsAppPhone = (rawPhone: string): string => {
  const digits = (rawPhone || "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("521") && digits.length >= 13) return digits;
  if (digits.startsWith("52") && digits.length === 12)
    return `52${digits.slice(2)}`;
  if (digits.length === 10) return `52${digits}`;
  return digits;
};

export const extractCustomerFromPayload = (
  payload: any,
): VisitCustomerContact | null => {
  if (!payload) return null;

  const customer = payload.customer || payload;
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  };
};

export const buildWhatsAppMessage = (
  customerName: string,
  services: Array<{
    serviceId?: string;
    serviceName?: string;
    quantity: number;
    unitPrice: number;
  }>,
  products: Array<{
    productId?: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
  }>,
  totalAmount: number,
): Result<string, DomainError> => {
  if (!services.length && !products.length) {
    return Err(
      ErrorFactories.validation(
        "Agrega al menos un servicio o producto para enviar por WhatsApp.",
        "visit_items_required",
      ),
    );
  }

  let message = `Hola ${customerName}, aquí tienes el detalle de tu cotización.\n\n`;
  message += "*Detalle:*\n";

  services.forEach((s) => {
    if (s.serviceId) {
      message += `- ${s.serviceName || "Servicio"} (x${s.quantity}): $${Number(s.unitPrice).toFixed(2)}\n`;
    }
  });

  products.forEach((p) => {
    if (p.productId) {
      message += `- ${p.productName || "Producto"} (x${p.quantity}): $${Number(p.unitPrice).toFixed(2)}\n`;
    }
  });

  message += `\n*Total estimado: $${totalAmount.toFixed(2)}*`;

  return Ok(message);
};

export const normalizeQuoteDisplayItems = (
  items:
    | Array<{
        name?: string;
        quantity?: string | number;
        unitPrice?: string | number;
      }>
    | null
    | undefined,
): QuoteDisplayItem[] => {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    name: item?.name || "Item",
    quantity: String(item?.quantity ?? 1),
    unitPrice: String(item?.unitPrice ?? 0),
  }));
};
