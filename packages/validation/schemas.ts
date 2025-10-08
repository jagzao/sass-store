/**
 * Validation schemas using Zod
 * Used across API routes for input validation
 */
import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  tenantSlug: z.string().min(1, 'Tenant es requerido'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  tenantSlug: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
  tenantSlug: z.string().min(1),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token es requerido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// Tenant schemas
export const createTenantSchema = z.object({
  slug: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  mode: z.enum(['catalog', 'booking']),
  branding: z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    logo: z.string().url().optional(),
    favicon: z.string().url().optional(),
  }),
  contact: z.object({
    phone: z.string(),
    email: z.string().email(),
    address: z.string(),
  }),
});

// Product schemas
export const createProductSchema = z.object({
  tenantId: z.string().uuid(),
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().min(1).max(50),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

// Booking schemas
export const createBookingSchema = z.object({
  tenantId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().min(10).optional(),
  startTime: z.string().datetime(),
  notes: z.string().optional(),
});

// Type exports for TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
