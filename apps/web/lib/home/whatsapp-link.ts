/**
 * WhatsApp Link Generation Utility
 *
 * Generates WhatsApp deep-links with prefilled messages for appointment confirmations.
 * Uses wa.me format which works on both mobile and desktop (WhatsApp Web).
 */

export interface WhatsAppLinkParams {
  /** Phone number in international format (e.g., 521234567890) */
  phone: string;
  /** Customer's name for personalization */
  customerName: string;
  /** Name of the business/tenant */
  tenantName: string;
  /** Optional service name */
  serviceName?: string;
  /** Optional appointment date/time */
  appointmentDate?: Date | string;
  /** Optional custom message template */
  customMessage?: string;
}

/**
 * Sanitize phone number for WhatsApp link
 * Removes spaces, dashes, parentheses, and ensures proper format
 */
export function sanitizePhone(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "");

  // Ensure it starts with country code
  // If it starts with 0, remove it
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // If it doesn't start with +, assume it needs the country code
  // For Mexico numbers (52), ensure proper format
  if (cleaned.length === 10 && !cleaned.startsWith("52")) {
    cleaned = "52" + cleaned;
  }

  return cleaned;
}

/**
 * Format date for WhatsApp message
 */
function formatDateForMessage(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Default message template for appointment confirmation
 */
function getDefaultMessage(params: WhatsAppLinkParams): string {
  const { customerName, tenantName, serviceName, appointmentDate } = params;

  let message = `Hola ${customerName}, te escribimos de ${tenantName} para confirmar tu cita`;

  if (serviceName) {
    message += ` de ${serviceName}`;
  }

  if (appointmentDate) {
    message += ` el ${formatDateForMessage(appointmentDate)}`;
  }

  message += `. ¿Podrías confirmarnos tu asistencia? ¡Gracias!`;

  return message;
}

/**
 * Generate WhatsApp deep-link with prefilled message
 *
 * @example
 * ```ts
 * const link = generateWhatsAppLink({
 *   phone: '521234567890',
 *   customerName: 'María García',
 *   tenantName: 'Wondernails',
 *   serviceName: 'Manicure',
 *   appointmentDate: new Date('2024-03-15T10:00:00')
 * });
 * // Returns: https://wa.me/521234567890?text=...
 * ```
 */
export function generateWhatsAppLink(params: WhatsAppLinkParams): string {
  const { phone, customMessage } = params;

  // Sanitize phone number
  const sanitizedPhone = sanitizePhone(phone);

  // Generate message
  const message = customMessage || getDefaultMessage(params);

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);

  // Build WhatsApp URL
  return `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;
}

/**
 * Generate WhatsApp link with simple confirmation request
 * Shorter message for quick confirmations
 */
export function generateQuickConfirmationLink(
  phone: string,
  customerName: string,
  tenantName: string
): string {
  return generateWhatsAppLink({
    phone,
    customerName,
    tenantName,
    customMessage: `Hola ${customerName}, ¿podrías confirmar tu cita en ${tenantName}? ¡Gracias!`,
  });
}

export default generateWhatsAppLink;
