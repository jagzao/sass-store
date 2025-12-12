/**
 * Validation schemas using Zod
 * Used across API routes for input validation
 */
import { z } from "zod";

// Common validation helpers
const passwordRegex = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;
const slugRegex = /^[a-z0-9-]+$/;
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

// Sanitization functions
export const sanitizeString = (value: string): string => {
  return value.trim().replace(/[<>]/g, "");
};

export const sanitizeEmail = (value: string): string => {
  return value.trim().toLowerCase();
};

export const sanitizeHtml = (value: string): string => {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
};

export const sanitizeOptionalString = (
  value: string | undefined,
): string | undefined => {
  if (!value) return undefined;
  return sanitizeString(value);
};

export const sanitizeOptionalHtml = (
  value: string | undefined,
): string | undefined => {
  if (!value) return undefined;
  return sanitizeHtml(value);
};

// Auth schemas
export const loginSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .regex(emailRegex, "Formato de email inválido")
    .transform(sanitizeEmail),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede exceder 128 caracteres")
    .regex(passwordRegex.uppercase, "Debe contener al menos una mayúscula")
    .regex(passwordRegex.lowercase, "Debe contener al menos una minúscula")
    .regex(passwordRegex.number, "Debe contener al menos un número")
    .regex(
      passwordRegex.special,
      "Debe contener al menos un carácter especial",
    ),
  tenantSlug: z
    .string()
    .min(1, "Tenant es requerido")
    .max(50, "El slug no puede exceder 50 caracteres")
    .regex(slugRegex, "Solo letras minúsculas, números y guiones")
    .transform(sanitizeString),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(
      /^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/,
      "El nombre solo puede contener letras y espacios",
    )
    .transform(sanitizeString),
  email: z
    .string()
    .email("Email inválido")
    .regex(emailRegex, "Formato de email inválido")
    .transform(sanitizeEmail),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede exceder 128 caracteres")
    .regex(passwordRegex.uppercase, "Debe contener al menos una mayúscula")
    .regex(passwordRegex.lowercase, "Debe contener al menos una minúscula")
    .regex(passwordRegex.number, "Debe contener al menos un número")
    .regex(
      passwordRegex.special,
      "Debe contener al menos un carácter especial",
    ),
  tenantSlug: z
    .string()
    .min(1, "Tenant es requerido")
    .max(50, "El slug no puede exceder 50 caracteres")
    .regex(slugRegex, "Solo letras minúsculas, números y guiones")
    .transform(sanitizeString),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .regex(emailRegex, "Formato de email inválido")
    .transform(sanitizeEmail),
  tenantSlug: z
    .string()
    .min(1, "Tenant es requerido")
    .max(50, "El slug no puede exceder 50 caracteres")
    .regex(slugRegex, "Solo letras minúsculas, números y guiones")
    .transform(sanitizeString),
});

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, "Token es requerido")
    .max(255, "Token demasiado largo")
    .transform(sanitizeString),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede exceder 128 caracteres")
    .regex(passwordRegex.uppercase, "Debe contener al menos una mayúscula")
    .regex(passwordRegex.lowercase, "Debe contener al menos una minúscula")
    .regex(passwordRegex.number, "Debe contener al menos un número")
    .regex(
      passwordRegex.special,
      "Debe contener al menos un carácter especial",
    ),
});

// Tenant schemas
export const createTenantSchema = z.object({
  slug: z
    .string()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .max(50, "El slug no puede exceder 50 caracteres")
    .regex(slugRegex, "Solo letras minúsculas, números y guiones")
    .transform(sanitizeString),
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(
      /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ&.,'-]+$/,
      "El nombre contiene caracteres inválidos",
    )
    .transform(sanitizeString),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .transform(sanitizeOptionalHtml),
  mode: z.enum(["catalog", "booking"], {
    errorMap: () => ({
      message: 'Modo inválido. Debe ser "catalog" o "booking"',
    }),
  }),
  branding: z.object({
    primaryColor: z
      .string()
      .regex(hexColorRegex, "Color primario inválido. Formato: #RRGGBB"),
    secondaryColor: z
      .string()
      .regex(hexColorRegex, "Color secundario inválido. Formato: #RRGGBB"),
    logo: z
      .string()
      .url("URL de logo inválida")
      .max(2048, "URL de logo demasiado larga")
      .optional(),
    favicon: z
      .string()
      .url("URL de favicon inválida")
      .max(2048, "URL de favicon demasiado larga")
      .optional(),
  }),
  contact: z.object({
    phone: z
      .string()
      .min(10, "El teléfono debe tener al menos 10 caracteres")
      .max(20, "El teléfono no puede exceder 20 caracteres")
      .regex(phoneRegex, "Formato de teléfono inválido")
      .transform(sanitizeString),
    email: z
      .string()
      .email("Email de contacto inválido")
      .regex(emailRegex, "Formato de email inválido")
      .transform(sanitizeEmail),
    address: z
      .string()
      .min(5, "La dirección debe tener al menos 5 caracteres")
      .max(200, "La dirección no puede exceder 200 caracteres")
      .transform(sanitizeString),
  }),
});

// Product schemas
export const createProductSchema = z.object({
  tenantId: z.string().uuid("ID de tenant inválido"),
  sku: z
    .string()
    .min(1, "SKU es requerido")
    .max(50, "SKU no puede exceder 50 caracteres")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "SKU solo puede contener letras, números y guiones",
    )
    .transform(sanitizeString),
  name: z
    .string()
    .min(1, "Nombre es requerido")
    .max(200, "Nombre no puede exceder 200 caracteres")
    .transform(sanitizeString),
  description: z
    .string()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .optional()
    .transform(sanitizeOptionalHtml),
  price: z
    .number()
    .positive("El precio debe ser un número positivo")
    .max(999999.99, "El precio no puede exceder 999,999.99"),
  category: z
    .string()
    .min(1, "Categoría es requerida")
    .max(50, "Categoría no puede exceder 50 caracteres")
    .transform(sanitizeString),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  metadata: z
    .record(z.any())
    .refine(
      (value) => JSON.stringify(value).length <= 5000,
      "Los metadatos no pueden exceder 5000 caracteres",
    )
    .optional(),
});

// Booking schemas
export const createBookingSchema = z.object({
  tenantId: z.string().uuid("ID de tenant inválido"),
  serviceId: z.string().uuid("ID de servicio inválido"),
  staffId: z.string().uuid("ID de staff inválido").optional(),
  customerName: z
    .string()
    .min(2, "El nombre del cliente debe tener al menos 2 caracteres")
    .max(100, "El nombre del cliente no puede exceder 100 caracteres")
    .regex(
      /^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/,
      "El nombre solo puede contener letras y espacios",
    )
    .transform(sanitizeString),
  customerEmail: z
    .string()
    .email("Email del cliente inválido")
    .regex(emailRegex, "Formato de email inválido")
    .transform(sanitizeEmail)
    .optional(),
  customerPhone: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 caracteres")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .regex(phoneRegex, "Formato de teléfono inválido")
    .transform(sanitizeString)
    .optional(),
  startTime: z.string().datetime("Fecha y hora de inicio inválida"),
  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional()
    .transform(sanitizeOptionalHtml),
});

// Type exports for TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
