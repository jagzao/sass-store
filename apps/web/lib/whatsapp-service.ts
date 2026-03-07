/**
 * WhatsApp Message Service
 *
 * Servicio para guardar y recuperar mensajes de WhatsApp en la DB
 */

import { db } from './db/connection';
import { whatsappMessages } from './db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

/**
 * Guardar mensaje saliente enviado via WhatsApp
 */
export async function guardarMensajeSaliente(data: {
  tenantId?: string;
  mensajeId: string;
  numero: string;
  contenido: string;
  tipo?: string;
  customerId?: string;
  relatedEntityType?: 'order' | 'booking' | 'quote' | 'customer';
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const result = await db.insert(whatsappMessages).values({
    tenantId: data.tenantId ? sql`${data.tenantId}::uuid` : null,
    mensajeId: data.mensajeId,
    numero: data.numero,
    contenido: data.contenido,
    tipo: data.tipo || 'text',
    direccion: 'outbound',
    estado: 'sent',
    customerId: data.customerId ? sql`${data.customerId}::uuid` : null,
    relatedEntityType: data.relatedEntityType || null,
    relatedEntityId: data.relatedEntityId ? sql`${data.relatedEntityId}::uuid` : null,
    metadata: data.metadata || null,
  }).returning();

  return result[0];
}

/**
 * Guardar mensaje entrante recibido via WhatsApp
 */
export async function guardarMensajeEntrante(data: {
  tenantId?: string;
  mensajeId: string;
  numero: string;
  contenido: string;
  tipo?: string;
  tipoInteraccion?: string;
  customerId?: string;
}) {
  const result = await db.insert(whatsappMessages).values({
    tenantId: data.tenantId ? sql`${data.tenantId}::uuid` : null,
    mensajeId: data.mensajeId,
    numero: data.numero,
    contenido: data.contenido,
    tipo: data.tipo || 'text',
    direccion: 'inbound',
    estado: 'received',
    tipoInteraccion: data.tipoInteraccion || null,
    customerId: data.customerId ? sql`${data.customerId}::uuid` : null,
  }).returning();

  return result[0];
}

/**
 * Obtener historial de mensajes de un número
 */
export async function obtenerHistorial(numero: string, limite = 10) {
  return db.select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.numero, numero))
    .orderBy(desc(whatsappMessages.createdAt))
    .limit(limite);
}

/**
 * Obtener mensajes relacionados a una entidad (pedido, cita, etc.)
 */
export async function obtenerMensajesPorEntidad(
  entityType: string,
  entityId: string
) {
  return db.select()
    .from(whatsappMessages)
    .where(
      and(
        eq(whatsappMessages.relatedEntityType, entityType),
        eq(whatsappMessages.relatedEntityId, sql`${entityId}::uuid`)
      )
    )
    .orderBy(desc(whatsappMessages.createdAt));
}

/**
 * Actualizar estado de un mensaje
 */
export async function actualizarEstadoMensaje(
  mensajeId: string,
  nuevoEstado: 'sent' | 'delivered' | 'read' | 'failed'
) {
  return db.update(whatsappMessages)
    .set({ estado: nuevoEstado, updatedAt: new Date() })
    .where(eq(whatsappMessages.mensajeId, mensajeId))
    .returning();
}

/**
 * Buscar cliente por número de teléfono
 */
export async function buscarClientePorTelefono(telefono: string) {
  // Implementar según el schema de customers
  // Por ahora retorna null - implementar con db.customers
  return null;
}
