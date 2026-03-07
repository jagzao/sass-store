import { Result, Ok, Err, match } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { db } from "@/lib/db";
import { customers, customerVisits, bookings } from "@/lib/db/schema";
import { eq, desc, and, isNull, gte, sql } from "drizzle-orm";

export interface RetouchEligibleCustomer {
  id: string;
  name: string;
  phone?: string | null;
  lastVisitDate: Date;
  daysSinceLastVisit: number;
}

export class RetouchMonitorService {
  /**
   * Obtiene la lista de clientas pendientes de retoque.
   * Criterios:
   * - Han pasado entre 15 y 20 días desde su última cita completada.
   * - NO tienen citas programadas a futuro.
   */
  static async getPendingRetouches(
    tenantId: string
  ): Promise<Result<RetouchEligibleCustomer[], DomainError>> {
    try {
      // 1. Obtener la última visita de todos los clientes activos del tenant
      const latestVisits = await db
        .select({
          customerId: customers.id,
          customerName: customers.name,
          customerPhone: customers.phone,
          visitDate: customerVisits.visitDate,
        })
        .from(customers)
        .innerJoin(
          customerVisits,
          and(
            eq(customers.id, customerVisits.customerId),
            eq(customerVisits.status, "completed")
          )
        )
        .where(
          and(
            eq(customers.tenantId, tenantId),
            eq(customers.status, "active")
          )
        )
        .orderBy(desc(customerVisits.visitDate));

      // Filter uniques (only truly last visit). PostgreSQL `distinct on` isn't fully portable in raw drizzle, JS filter works for low counts, 
      // but let's use a query-level uniqueness map cache to only grab the newest per customer.
      const uniqueVisitsMap = new Map<string, typeof latestVisits[0]>();
      
      for (const visit of latestVisits) {
        if (!uniqueVisitsMap.has(visit.customerId)) {
          uniqueVisitsMap.set(visit.customerId, visit);
        }
      }

      const eligibleList: RetouchEligibleCustomer[] = [];
      const now = new Date();
      // Normalize 'now' to start of day for accurate day counting
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 2. Filtrar clientes entre 15 y 20 días
      for (const visit of uniqueVisitsMap.values()) {
        const visitDateObj = new Date(visit.visitDate);
        const visitStart = new Date(visitDateObj.getFullYear(), visitDateObj.getMonth(), visitDateObj.getDate());
        
        // Calculate days difference
        const timeDiff = todayStart.getTime() - visitStart.getTime();
        const daysSinceLastVisit = Math.floor(timeDiff / (1000 * 3600 * 24));

        if (daysSinceLastVisit >= 15 && daysSinceLastVisit <= 20) {
          eligibleList.push({
            id: visit.customerId,
            name: visit.customerName,
            phone: visit.customerPhone,
            lastVisitDate: visitDateObj,
            daysSinceLastVisit,
          });
        }
      }

      // 3. Excluir a clientes que ya tienen citas reservadas al futuro (o hoy mismo posteriores)
      if (eligibleList.length > 0) {
        const customerIds = eligibleList.map(c => c.id);
        
        // Citas reservadas actualmente que no estén canceladas ni completadas.
        const futureBookingsQuery = await db
          .select({
            customerName: bookings.customerName,
            customerPhone: bookings.customerPhone
          })
          .from(bookings)
          .where(
            and(
              eq(bookings.tenantId, tenantId),
              gte(bookings.startTime, todayStart), // Tienen cita de hoy en adelante
              eq(bookings.status, "pending")
              // Nota: Booking Schema doesn't directly link to CustomerId globally. It relies on customerPhone/Name usually, 
              // or metadata! Let's filter in DB based on exact matches or manual exclusions if Customer linking is loose.
            )
          );
          
         // We will filter out eligible customers if they have a matching name/phone in future pending/scheduled bookings.
         const finalFilteredList = eligibleList.filter(eligibleItem => {
            const hasFutureBooking = futureBookingsQuery.some(fb => 
               (fb.customerPhone === eligibleItem.phone && eligibleItem.phone) || 
               (fb.customerName.toLowerCase() === eligibleItem.name.toLowerCase())
            );
            return !hasFutureBooking;
         });

         return Ok(finalFilteredList);
      }

      return Ok([]);

    } catch (error) {
      console.error("[RetouchMonitorService] Error:", error);
      try { require('fs').writeFileSync('pg-error-dump.json', JSON.stringify(error, Object.getOwnPropertyNames(error), 2)); } catch(e){}
      return Err(
        ErrorFactories.database(
          "get_pending_retouches",
          `Error al calcular retouches pendientes: ${error instanceof Error ? error.message : String(error)}`,
          undefined,
          error instanceof Error ? error : new Error(String(error))
        )
      );
    }
  }
}
