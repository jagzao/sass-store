/**
 * Servicios de dominio para cotizador de uñas.
 * Result Pattern, sin try/catch.
 */

import { db } from "@sass-store/database";
import {
  nailQuoteOptions,
  nailQuotes,
  nailQuoteLines,
  customers,
  tenants,
  tenantConfigs,
  bookings,
  bookingDeposits,
  services,
} from "@sass-store/database/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  calculateNailQuote,
  formatNailQuoteDuration,
  formatNailQuotePrice,
  NailQuoteCalculation,
  NailOptionCategory,
} from "@sass-store/core/src/services/nail-quote/calculate";
import type { NailQuoteLine } from "@sass-store/core/src/services/nail-quote/types";

export type CreateNailQuoteInput = {
  tenantId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  selectedOptionIds: string[];
  idempotencyKey?: string;
};

export type CreateNailBookingInput = {
  tenantId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  selectedOptionIds: string[];
  startTime: Date;
  staffId?: string;
  notes?: string;
  idempotencyKey?: string;
};

const getActiveCatalog = async (tenantId: string) => {
  const rows = await db
    .select()
    .from(nailQuoteOptions)
    .where(
      and(
        eq(nailQuoteOptions.tenantId, tenantId),
        eq(nailQuoteOptions.isActive, true),
      ),
    )
    .orderBy(nailQuoteOptions.category, nailQuoteOptions.order);
  return rows.map((o) => ({
    ...o,
    category: o.category as NailOptionCategory,
    imageUrl: o.imageUrl ?? undefined,
  }));
};

const findCustomer = async (tenantId: string, customerId: string) => {
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.tenantId, tenantId), eq(customers.id, customerId)))
    .limit(1);
  return customer;
};

const ensureCustomer = async (
  tenantId: string,
  customerId: string | undefined,
  phone: string | undefined,
  name: string | undefined,
): Promise<
  Result<{ id: string; name: string; phone: string }, DomainError>
> => {
  if (customerId) {
    const customer = await findCustomer(tenantId, customerId);
    if (!customer) {
      return Err(ErrorFactories.notFound("Customer", customerId));
    }
    return Ok({ id: customer.id, name: customer.name, phone: customer.phone });
  }

  if (!phone) {
    return Err(
      ErrorFactories.validation(
        "Selecciona un cliente o escribe un telefono para enviar la cotizacion",
        "customerPhone",
      ),
    );
  }

  const normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.length < 10) {
    return Err(
      ErrorFactories.validation(
        "El numero de telefono debe tener al menos 10 digitos",
        "customerPhone",
        phone,
      ),
    );
  }

  // Try to find existing customer by phone in tenant
  const [existing] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, tenantId),
        sql`regexp_replace(${customers.phone}, '\D', '', 'g') = ${normalizedPhone}`,
      ),
    )
    .limit(1);

  if (existing) {
    return Ok({ id: existing.id, name: existing.name, phone: existing.phone });
  }

  if (!name || name.trim().length === 0) {
    return Err(
      ErrorFactories.validation(
        "Escribe el nombre del cliente nuevo para continuar",
        "customerName",
      ),
    );
  }

  const [created] = await db
    .insert(customers)
    .values({
      tenantId,
      name: name.trim(),
      phone,
      email: null,
      address: null,
      generalNotes: "Cliente creado desde cotizador de uñas",
      tags: [],
      status: "active",
      balanceFavor: "0",
      metadata: {},
    })
    .returning();

  return Ok({ id: created.id, name: created.name, phone: created.phone });
};

const calculateQuote = async (
  tenantId: string,
  selectedOptionIds: string[],
): Promise<Result<NailQuoteCalculation, DomainError>> => {
  const catalog = await getActiveCatalog(tenantId);
  return calculateNailQuote(selectedOptionIds, catalog);
};

export const createNailQuote = async (
  input: CreateNailQuoteInput,
): Promise<
  Result<
    {
      quote: typeof nailQuotes.$inferSelect;
      lines: (typeof nailQuoteLines.$inferSelect)[];
    },
    DomainError
  >
> => {
  if (!input.selectedOptionIds || input.selectedOptionIds.length === 0) {
    return Err(
      ErrorFactories.validation(
        "Selecciona material, largo y forma para continuar",
        "selectedOptionIds",
      ),
    );
  }

  const calcResult = await calculateQuote(
    input.tenantId,
    input.selectedOptionIds,
  );
  if (!calcResult.success) return calcResult;
  const calc = calcResult.data;

  const customerResult = await ensureCustomer(
    input.tenantId,
    input.customerId,
    input.customerPhone,
    input.customerName,
  );
  if (!customerResult.success) return customerResult;
  const customer = customerResult.data;

  const quoteNumber = `NU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  const quoteResult = await fromPromise(
    db.transaction(async (tx) => {
      // Idempotency: return existing quote if key matches
      if (input.idempotencyKey) {
        const [existing] = await tx
          .select()
          .from(nailQuotes)
          .where(
            and(
              eq(nailQuotes.tenantId, input.tenantId),
              eq(nailQuotes.idempotencyKey, input.idempotencyKey),
            ),
          )
          .limit(1);
        if (existing) {
          const existingLines = await tx
            .select()
            .from(nailQuoteLines)
            .where(eq(nailQuoteLines.quoteId, existing.id));
          return { quote: existing, lines: existingLines };
        }
      }

      const [quote] = await tx
        .insert(nailQuotes)
        .values({
          tenantId: input.tenantId,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          totalAmount: (calc.total / 100).toFixed(2),
          durationMinutes: calc.durationMinutes,
          status: "pending",
          source: "nail_quoter",
          idempotencyKey: input.idempotencyKey ?? null,
          metadata: {},
        })
        .returning();

      const lines = await tx
        .insert(nailQuoteLines)
        .values(
          calc.lines.map((line: NailQuoteLine, index: number) => ({
            quoteId: quote.id,
            optionId: line.optionId,
            category: line.category,
            key: line.key,
            label: line.label,
            unitPrice: (line.unitPrice / 100).toFixed(2),
            durationMinutes: line.durationMinutes,
            order: index,
            metadata: {},
          })),
        )
        .returning();

      return { quote, lines };
    }),
    (error) =>
      ErrorFactories.database(
        "createNailQuote",
        "Failed to create nail quote",
        undefined,
        error as Error,
      ),
  );

  return quoteResult;
};

export const createNailBooking = async (
  input: CreateNailBookingInput,
): Promise<
  Result<
    {
      booking: typeof bookings.$inferSelect;
      deposit?: typeof bookingDeposits.$inferSelect;
    },
    DomainError
  >
> => {
  if (!input.selectedOptionIds || input.selectedOptionIds.length === 0) {
    return Err(
      ErrorFactories.validation(
        "Selecciona material, largo y forma para continuar",
        "selectedOptionIds",
      ),
    );
  }

  const calcResult = await calculateQuote(
    input.tenantId,
    input.selectedOptionIds,
  );
  if (!calcResult.success) return calcResult;
  const calc = calcResult.data;

  const customerResult = await ensureCustomer(
    input.tenantId,
    input.customerId,
    input.customerPhone,
    input.customerName,
  );
  if (!customerResult.success) return customerResult;
  const customer = customerResult.data;

  // Need a fallback serviceId for booking. Use first material option's mapped service or generic.
  const materialLine = calc.lines.find(
    (l: NailQuoteLine) => l.category === "material",
  );
  if (!materialLine) {
    return Err(
      ErrorFactories.validation("Debes seleccionar un material", "material"),
    );
  }

  const [mappedOption] = await db
    .select()
    .from(nailQuoteOptions)
    .where(eq(nailQuoteOptions.id, materialLine.optionId))
    .limit(1);

  const fallbackServiceId = (
    mappedOption?.metadata as { serviceId?: string } | null
  )?.serviceId;

  // Find any active service in tenant to satisfy FK
  const [anyService] = await db
    .select({ id: services.id })
    .from(services)
    .where(
      and(eq(services.tenantId, input.tenantId), eq(services.active, true)),
    )
    .limit(1);

  if (!anyService && !fallbackServiceId) {
    return Err(
      ErrorFactories.configuration(
        "services",
        "No hay servicios activos en el tenant para crear la cita",
      ),
    );
  }

  const serviceId = fallbackServiceId || anyService!.id;
  const endTime = new Date(
    input.startTime.getTime() + calc.durationMinutes * 60000,
  );

  const result = await fromPromise(
    db.transaction(async (tx) => {
      // Idempotency check
      if (input.idempotencyKey) {
        const [existing] = await tx
          .select()
          .from(nailQuotes)
          .where(
            and(
              eq(nailQuotes.tenantId, input.tenantId),
              eq(nailQuotes.idempotencyKey, input.idempotencyKey),
            ),
          )
          .limit(1);
        if (existing) {
          const [existingBooking] = await tx
            .select()
            .from(bookings)
            .where(eq(bookings.id, existing.id as any))
            .limit(1);
          if (existingBooking) return { booking: existingBooking };
        }
      }

      const [booking] = await tx
        .insert(bookings)
        .values({
          tenantId: input.tenantId,
          serviceId,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          startTime: input.startTime,
          endTime,
          status: "pending",
          notes:
            input.notes ??
            `Cotizador: ${calc.lines.map((l: NailQuoteLine) => l.label).join(", ")}`,
          totalPrice: (calc.total / 100).toFixed(2),
          staffId: input.staffId ?? null,
          metadata: { source: "nail_quoter", lines: calc.lines },
        })
        .returning();

      // Deposit: 30% of total by default if tenant has no config
      const depositAmount = Math.round(calc.total * 0.3) / 100;
      const [deposit] = await tx
        .insert(bookingDeposits)
        .values({
          tenantId: input.tenantId,
          bookingId: booking.id,
          amount: depositAmount.toFixed(2),
          status: "pending",
          dueAt: input.startTime,
          metadata: { percentage: 30 },
        })
        .returning();

      return { booking, deposit };
    }),
    (error) =>
      ErrorFactories.database(
        "createNailBooking",
        "Failed to create nail booking",
        undefined,
        error as Error,
      ),
  );

  return result;
};

export const getTenantNailQuoteCatalog = async (tenantId: string) => {
  return getActiveCatalog(tenantId);
};

export const isNailSalon = async (tenantSlug: string): Promise<boolean> => {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) return false;

  const [config] = await db
    .select({ value: tenantConfigs.value })
    .from(tenantConfigs)
    .where(
      and(
        eq(tenantConfigs.tenantId, tenant.id),
        eq(tenantConfigs.category, "business"),
        eq(tenantConfigs.key, "type"),
      ),
    )
    .limit(1);

  if (!config?.value) return false;
  const types = Array.isArray(config.value) ? config.value : [config.value];
  return types.includes("nail_salon");
};

export const buildNailQuoteWhatsAppMessage = (
  customerName: string,
  lines: NailQuoteLine[],
  totalCents: number,
  durationMinutes: number,
): string => {
  const header = `Hola ${customerName}, aqui tienes tu cotizacion de uñas.\n\n`;
  const detail = lines
    .map((line) => `- ${line.label}: ${formatNailQuotePrice(line.unitPrice)}`)
    .join("\n");
  const footer = `\n\n*Total estimado: ${formatNailQuotePrice(totalCents)}*`;
  const duration = `\n*Duracion aprox: ${formatNailQuoteDuration(durationMinutes)}*`;
  return `${header}${detail}${footer}${duration}`;
};

export const buildBookingConfirmationWhatsAppMessage = (
  customerName: string,
  startTime: Date,
  includeDeposit: boolean,
): string => {
  const weekdays = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miercoles",
    "Jueves",
    "Viernes",
    "Sabado",
  ];
  const weekday = weekdays[startTime.getDay()];
  const day = startTime.getDate().toString();
  const hour = startTime.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const depositPart = includeDeposit ? "esperamos tu anticipo, " : "";

  return `Hola ${customerName}, ${depositPart}tu cita ha sido generada. Estamos listos para recibirte el dia ${weekday} ${day} a las ${hour}`;
};
