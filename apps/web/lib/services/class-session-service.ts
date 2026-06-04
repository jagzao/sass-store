import { db } from "@sass-store/database";
import {
  classSessions,
  sessionEnrollments,
  sessionAttendance,
  customers,
  staff,
  tenants,
} from "@sass-store/database/schema";
import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { and, eq, gte, lte, sql, desc } from "drizzle-orm";
import {
  findCustomerMatches,
  pickBestCustomerMatch,
} from "@/lib/customers/match-customer";
import {
  enqueueSessionReminderNotifications,
  rescheduleSessionReminderNotifications,
} from "@/lib/notifications/session-reminder-notification";
import { enqueueSessionEnrollmentConfirmation } from "@/lib/notifications/session-enrollment-notification";
import { cancelPendingSessionEnrollmentNotifications } from "@/lib/notifications/scheduled-notification-queue";

export type ClassSessionStatus = "scheduled" | "cancelled" | "completed";

export type CreateClassSessionInput = {
  title: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  maxCapacity: number;
  staffId?: string;
  location?: string;
};

export type UpdateClassSessionInput = Partial<CreateClassSessionInput> & {
  status?: ClassSessionStatus;
};

export type EnrollSessionInput = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
};

export type AttendanceUpdate = {
  enrollmentId: string;
  present: boolean;
};

function validateSessionTimes(
  startsAt: Date,
  endsAt: Date,
): Result<void, DomainError> {
  if (startsAt >= endsAt) {
    return Err(
      ErrorFactories.validation(
        "La hora de inicio debe ser anterior a la de fin",
        "startsAt",
      ),
    );
  }
  return Ok(undefined);
}

async function getTenantMeta(
  tenantId: string,
): Promise<{ slug: string; name: string } | null> {
  const [row] = await db
    .select({ slug: tenants.slug, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return row ?? null;
}

async function countActiveEnrollments(sessionId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sessionEnrollments)
    .where(
      and(
        eq(sessionEnrollments.sessionId, sessionId),
        eq(sessionEnrollments.status, "active"),
      ),
    );
  return Number(row?.count ?? 0);
}

async function resolveOrCreateCustomer(
  tenantId: string,
  input: EnrollSessionInput,
): Promise<Result<string, DomainError>> {
  const matches = await findCustomerMatches(tenantId, {
    name: input.customerName,
    email: input.customerEmail,
    phone: input.customerPhone,
  });
  const best = pickBestCustomerMatch(matches);
  if (best) {
    return Ok(best.id);
  }

  const insertResult = await fromPromise(
    db
      .insert(customers)
      .values({
        tenantId,
        name: input.customerName.trim(),
        phone: input.customerPhone.trim(),
        email: input.customerEmail?.trim() || null,
        status: "active",
      })
      .returning({ id: customers.id }),
    (error) =>
      ErrorFactories.database(
        "create_customer_for_enrollment",
        "No se pudo crear el alumno",
        undefined,
        error instanceof Error ? error : new Error(String(error)),
      ),
  );

  if (insertResult.success === false) return insertResult;
  const [row] = insertResult.data;
  if (!row) {
    return Err(
      ErrorFactories.database(
        "create_customer_for_enrollment",
        "Sin respuesta",
      ),
    );
  }
  return Ok(row.id);
}

export class ClassSessionService {
  static async listSessions(
    tenantId: string,
    filters?: { from?: Date; to?: Date; status?: ClassSessionStatus },
  ): Promise<Result<Array<Record<string, unknown>>, DomainError>> {
    const conditions = [eq(classSessions.tenantId, tenantId)];
    if (filters?.from) {
      conditions.push(gte(classSessions.startsAt, filters.from));
    }
    if (filters?.to) {
      conditions.push(lte(classSessions.startsAt, filters.to));
    }
    if (filters?.status) {
      conditions.push(eq(classSessions.status, filters.status));
    }

    const queryResult = await fromPromise(
      db.query.classSessions.findMany({
        where: and(...conditions),
        with: {
          staff: true,
          enrollments: {
            where: eq(sessionEnrollments.status, "active"),
            with: {
              customer: true,
              attendance: true,
            },
          },
        },
        orderBy: [desc(classSessions.startsAt)],
        limit: 100,
      }),
      (error) =>
        ErrorFactories.database(
          "list_class_sessions",
          "Error al listar sesiones",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        ),
    );

    if (queryResult.success === false) return queryResult;

    const mapped = queryResult.data.map((session) => ({
      id: session.id,
      tenantId: session.tenantId,
      title: session.title,
      description: session.description,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      maxCapacity: session.maxCapacity,
      staffId: session.staffId,
      staffName: session.staff?.name ?? null,
      status: session.status,
      location: session.location,
      enrollmentCount: session.enrollments?.length ?? 0,
      enrollments: session.enrollments?.map((e) => ({
        id: e.id,
        customerId: e.customerId,
        customerName: e.customer?.name ?? "",
        customerPhone: e.customer?.phone ?? "",
        present: e.attendance?.present ?? false,
        attendanceId: e.attendance?.id ?? null,
      })),
    }));

    return Ok(mapped);
  }

  static async getSession(
    tenantId: string,
    sessionId: string,
  ): Promise<Result<Record<string, unknown>, DomainError>> {
    const listResult = await ClassSessionService.listSessions(tenantId);
    if (listResult.success === false) return listResult;
    const session = listResult.data.find((s) => s.id === sessionId);
    if (!session) {
      return Err(ErrorFactories.notFound("ClassSession", sessionId));
    }
    return Ok(session);
  }

  static async createSession(
    tenantId: string,
    input: CreateClassSessionInput,
  ): Promise<Result<Record<string, unknown>, DomainError>> {
    const timeCheck = validateSessionTimes(input.startsAt, input.endsAt);
    if (!timeCheck.success) return timeCheck;

    if (input.maxCapacity < 1 || input.maxCapacity > 100) {
      return Err(
        ErrorFactories.validation(
          "Cupo debe estar entre 1 y 100",
          "maxCapacity",
        ),
      );
    }

    const insertResult = await fromPromise(
      db
        .insert(classSessions)
        .values({
          tenantId,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          maxCapacity: input.maxCapacity,
          staffId: input.staffId || null,
          location: input.location?.trim() || null,
          status: "scheduled",
        })
        .returning(),
      (error) =>
        ErrorFactories.database(
          "create_class_session",
          "Error al crear sesión",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        ),
    );

    if (insertResult.success === false) return insertResult;
    const [row] = insertResult.data;
    return Ok({ ...row, enrollmentCount: 0, enrollments: [] });
  }

  static async updateSession(
    tenantId: string,
    sessionId: string,
    input: UpdateClassSessionInput,
  ): Promise<Result<Record<string, unknown>, DomainError>> {
    const existingResult = await ClassSessionService.getSession(
      tenantId,
      sessionId,
    );
    if (existingResult.success === false) return existingResult;

    const existing = existingResult.data;
    const startsAt = input.startsAt ?? new Date(existing.startsAt as string);
    const endsAt = input.endsAt ?? new Date(existing.endsAt as string);
    const timeCheck = validateSessionTimes(startsAt, endsAt);
    if (!timeCheck.success) return timeCheck;

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.description !== undefined)
      patch.description = input.description.trim() || null;
    if (input.startsAt !== undefined) patch.startsAt = input.startsAt;
    if (input.endsAt !== undefined) patch.endsAt = input.endsAt;
    if (input.maxCapacity !== undefined) patch.maxCapacity = input.maxCapacity;
    if (input.staffId !== undefined) patch.staffId = input.staffId || null;
    if (input.location !== undefined)
      patch.location = input.location.trim() || null;
    if (input.status !== undefined) patch.status = input.status;

    const updateResult = await fromPromise(
      db
        .update(classSessions)
        .set(patch as typeof classSessions.$inferInsert)
        .where(
          and(
            eq(classSessions.id, sessionId),
            eq(classSessions.tenantId, tenantId),
          ),
        )
        .returning(),
      (error) =>
        ErrorFactories.database(
          "update_class_session",
          "Error al actualizar sesión",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        ),
    );

    if (updateResult.success === false) return updateResult;
    const [row] = updateResult.data;
    if (!row) {
      return Err(ErrorFactories.notFound("ClassSession", sessionId));
    }

    if (input.startsAt) {
      const tenantMeta = await getTenantMeta(tenantId);
      if (tenantMeta) {
        const activeEnrollments = await db
          .select({
            enrollmentId: sessionEnrollments.id,
            customerId: sessionEnrollments.customerId,
            customerName: customers.name,
            customerPhone: customers.phone,
          })
          .from(sessionEnrollments)
          .innerJoin(customers, eq(sessionEnrollments.customerId, customers.id))
          .where(
            and(
              eq(sessionEnrollments.sessionId, sessionId),
              eq(sessionEnrollments.status, "active"),
            ),
          );

        for (const enr of activeEnrollments) {
          await rescheduleSessionReminderNotifications({
            tenantId,
            tenantSlug: tenantMeta.slug,
            tenantName: tenantMeta.name,
            enrollmentId: enr.enrollmentId,
            customerId: enr.customerId,
            customerName: enr.customerName,
            customerPhone: enr.customerPhone,
            sessionTitle: row.title,
            location: row.location,
            startTime: row.startsAt,
          });
        }
      }
    }

    return ClassSessionService.getSession(tenantId, sessionId);
  }

  static async deleteSession(
    tenantId: string,
    sessionId: string,
    force = false,
  ): Promise<Result<{ deleted: boolean }, DomainError>> {
    const count = await countActiveEnrollments(sessionId);
    if (count > 0 && !force) {
      return Err(
        ErrorFactories.businessRule(
          "session_has_enrollments",
          "La sesión tiene alumnos inscritos. Confirma la eliminación.",
        ),
      );
    }

    const enrollments = await db
      .select({ id: sessionEnrollments.id })
      .from(sessionEnrollments)
      .where(eq(sessionEnrollments.sessionId, sessionId));

    for (const enr of enrollments) {
      await cancelPendingSessionEnrollmentNotifications(enr.id);
    }

    const deleteResult = await fromPromise(
      db
        .delete(classSessions)
        .where(
          and(
            eq(classSessions.id, sessionId),
            eq(classSessions.tenantId, tenantId),
          ),
        )
        .returning({ id: classSessions.id }),
      (error) =>
        ErrorFactories.database(
          "delete_class_session",
          "Error al eliminar sesión",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        ),
    );

    if (deleteResult.success === false) return deleteResult;
    if (!deleteResult.data.length) {
      return Err(ErrorFactories.notFound("ClassSession", sessionId));
    }
    return Ok({ deleted: true });
  }

  static async enrollStudent(
    tenantId: string,
    tenantSlug: string,
    tenantName: string,
    sessionId: string,
    input: EnrollSessionInput,
  ): Promise<Result<Record<string, unknown>, DomainError>> {
    const [session] = await db
      .select()
      .from(classSessions)
      .where(
        and(
          eq(classSessions.id, sessionId),
          eq(classSessions.tenantId, tenantId),
          eq(classSessions.status, "scheduled"),
        ),
      )
      .limit(1);

    if (!session) {
      return Err(ErrorFactories.notFound("ClassSession", sessionId));
    }

    if (session.startsAt < new Date()) {
      return Err(
        ErrorFactories.businessRule(
          "session_started",
          "Esta sesión ya comenzó o finalizó",
        ),
      );
    }

    const customerResult = await resolveOrCreateCustomer(tenantId, input);
    if (customerResult.success === false) return customerResult;
    const customerId = customerResult.data;

    const [existingEnrollment] = await db
      .select({ id: sessionEnrollments.id })
      .from(sessionEnrollments)
      .where(
        and(
          eq(sessionEnrollments.sessionId, sessionId),
          eq(sessionEnrollments.customerId, customerId),
          eq(sessionEnrollments.status, "active"),
        ),
      )
      .limit(1);

    if (existingEnrollment) {
      return Err(
        ErrorFactories.businessRule(
          "already_enrolled",
          "Este alumno ya está inscrito en esta sesión",
        ),
      );
    }

    const enrollResult = await fromPromise(
      db.transaction(async (tx) => {
        const [countRow] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(sessionEnrollments)
          .where(
            and(
              eq(sessionEnrollments.sessionId, sessionId),
              eq(sessionEnrollments.status, "active"),
            ),
          );

        if (Number(countRow?.count ?? 0) >= session.maxCapacity) {
          throw new Error("CAPACITY_FULL");
        }

        const [enrollment] = await tx
          .insert(sessionEnrollments)
          .values({
            sessionId,
            customerId,
            tenantId,
            status: "active",
          })
          .returning();

        await tx.insert(sessionAttendance).values({
          enrollmentId: enrollment.id,
          present: false,
        });

        const [customer] = await tx
          .select({
            name: customers.name,
            phone: customers.phone,
            email: customers.email,
          })
          .from(customers)
          .where(eq(customers.id, customerId))
          .limit(1);

        return { enrollment, customer };
      }),
      (error) => {
        if (error instanceof Error && error.message === "CAPACITY_FULL") {
          return ErrorFactories.businessRule(
            "capacity_full",
            "Cupo agotado para esta sesión",
          );
        }
        return ErrorFactories.database(
          "enroll_session",
          "Error al inscribir alumno",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        );
      },
    );

    if (enrollResult.success === false) return enrollResult;

    const { enrollment, customer } = enrollResult.data;
    const notifBase = {
      tenantId,
      tenantSlug,
      tenantName,
      enrollmentId: enrollment.id,
      customerId,
      customerName: customer?.name ?? input.customerName,
      customerPhone: customer?.phone ?? input.customerPhone,
      sessionTitle: session.title,
      location: session.location,
      startTime: session.startsAt,
    };

    try {
      await enqueueSessionEnrollmentConfirmation(notifBase);
      await enqueueSessionReminderNotifications(notifBase);
    } catch (e) {
      console.error("Session notification enqueue error:", e);
    }

    return Ok({
      enrollmentId: enrollment.id,
      sessionId,
      customerId,
      customerName: customer?.name,
    });
  }

  static async markAttendance(
    tenantId: string,
    sessionId: string,
    updates: AttendanceUpdate[],
    markedBy?: string,
  ): Promise<Result<{ updated: number }, DomainError>> {
    const [session] = await db
      .select({ id: classSessions.id })
      .from(classSessions)
      .where(
        and(
          eq(classSessions.id, sessionId),
          eq(classSessions.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!session) {
      return Err(ErrorFactories.notFound("ClassSession", sessionId));
    }

    let updated = 0;
    for (const item of updates) {
      const [enrollment] = await db
        .select({ id: sessionEnrollments.id })
        .from(sessionEnrollments)
        .where(
          and(
            eq(sessionEnrollments.id, item.enrollmentId),
            eq(sessionEnrollments.sessionId, sessionId),
            eq(sessionEnrollments.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!enrollment) continue;

      await db
        .update(sessionAttendance)
        .set({
          present: item.present,
          markedAt: new Date(),
          markedBy: markedBy ?? null,
        })
        .where(eq(sessionAttendance.enrollmentId, item.enrollmentId));
      updated += 1;
    }

    return Ok({ updated });
  }
}
