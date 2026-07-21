import { db } from "@sass-store/database";
import { feedback, tenants } from "@sass-store/database/schema";
import type { Feedback } from "@sass-store/database/types";
import { eq, and, desc, sql } from "drizzle-orm";
import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  CreateFeedbackInput,
  ListFeedbackQuery,
} from "@sass-store/validation/src/feedback";

export interface FeedbackContext {
  route?: string;
  userAgent?: string;
  previousError?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SubmitFeedbackInput extends CreateFeedbackInput {
  tenantId: string;
  userId?: string;
  context?: FeedbackContext;
}

export interface SubmitFeedbackResult {
  feedbackId: string;
  status: "sent" | "stored";
  message: string;
}

const N8N_WEBHOOK_URL = process.env.N8N_FEEDBACK_WEBHOOK_URL;

const getTenantById = async (
  tenantId: string,
): Promise<Result<{ id: string; slug: string }, DomainError>> => {
  const result = await fromPromise(
    db
      .select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1),
    (error) =>
      ErrorFactories.database(
        "get_tenant",
        "Failed to resolve tenant",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!result.success) {
    return result;
  }

  const [tenant] = result.data;
  if (!tenant) {
    return Err(ErrorFactories.notFound("Tenant", tenantId));
  }

  return Ok(tenant);
};

const sendToN8n = async (
  feedbackId: string,
  record: {
    tenantId: string;
    tenantSlug: string;
    category: string;
    message: string;
    context: FeedbackContext;
    userId?: string;
    email?: string;
    createdAt: string;
  },
): Promise<
  Result<{ ok: boolean; statusCode?: number; body?: unknown }, DomainError>
> => {
  if (!N8N_WEBHOOK_URL) {
    return Err(
      ErrorFactories.configuration(
        "N8N_FEEDBACK_WEBHOOK_URL",
        "Webhook URL not configured",
        "string",
      ),
    );
  }

  const fetchResult = await fromPromise(
    fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    }),
    (error) =>
      ErrorFactories.network(
        "Failed to reach n8n webhook",
        N8N_WEBHOOK_URL,
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!fetchResult.success) {
    return fetchResult;
  }

  const response = fetchResult.data;
  const bodyResult = await fromPromise(
    response.json().catch(() => ({
      status: response.status,
      statusText: response.statusText,
    })),
    (error) =>
      ErrorFactories.network(
        "Failed to parse n8n response",
        N8N_WEBHOOK_URL,
        response.status,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!bodyResult.success) {
    return bodyResult;
  }

  if (!response.ok) {
    return Err(
      ErrorFactories.network(
        "n8n webhook returned an error",
        N8N_WEBHOOK_URL,
        response.status,
      ),
    );
  }

  return Ok({ ok: true, statusCode: response.status, body: bodyResult.data });
};

const insertFeedbackRecord = async (
  input: SubmitFeedbackInput,
): Promise<Result<Feedback, DomainError>> => {
  const tenantResult = await getTenantById(input.tenantId);
  if (!tenantResult.success) {
    return tenantResult as Result<never, DomainError>;
  }

  const tenant = tenantResult.data;
  const context: FeedbackContext = {
    ...input.context,
    route: input.context?.route ?? input.route,
  };

  const insertResult = await fromPromise(
    db
      .insert(feedback)
      .values({
        tenantId: tenant.id,
        category: input.category,
        message: input.message,
        context,
        userId: input.userId,
        email: input.email,
        status: "pending",
        n8nRequestUrl: N8N_WEBHOOK_URL ?? null,
        attempts: 0,
      })
      .returning(),
    (error) =>
      ErrorFactories.database(
        "create_feedback",
        "Failed to store feedback",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!insertResult.success) {
    return insertResult;
  }

  const [record] = insertResult.data;
  if (!record) {
    return Err(
      ErrorFactories.database("create_feedback", "No record returned"),
    );
  }

  return Ok(record);
};

const updateFeedbackStatus = async (
  feedbackId: string,
  status: "sent" | "failed" | "retrying",
  n8nResponse?: unknown,
): Promise<Result<void, DomainError>> => {
  const result = await fromPromise(
    db
      .update(feedback)
      .set({
        status,
        n8nResponse: n8nResponse ?? null,
        attempts: sql`${feedback.attempts} + 1`,
        lastAttemptAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(feedback.id, feedbackId)),
    (error) =>
      ErrorFactories.database(
        "update_feedback_status",
        "Failed to update feedback status",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  return result.success ? Ok(undefined) : result;
};

export const submitFeedback = async (
  input: SubmitFeedbackInput,
): Promise<Result<SubmitFeedbackResult, DomainError>> => {
  const tenantResult = await getTenantById(input.tenantId);
  if (!tenantResult.success) {
    return tenantResult as Result<never, DomainError>;
  }

  const tenant = tenantResult.data;

  const insertResult = await insertFeedbackRecord(input);
  if (!insertResult.success) {
    return insertResult as Result<never, DomainError>;
  }

  const record = insertResult.data;

  const n8nPayload = {
    feedbackId: record.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    category: input.category,
    message: input.message,
    context: record.context as FeedbackContext,
    userId: input.userId,
    email: input.email,
    createdAt: record.createdAt.toISOString(),
  };

  const n8nResult = await sendToN8n(record.id, n8nPayload);

  if (!n8nResult.success) {
    await updateFeedbackStatus(record.id, "failed", {
      error: n8nResult.error.message,
      type: n8nResult.error.type,
    });

    return Ok({
      feedbackId: record.id,
      status: "stored",
      message: "Lo guardamos, lo procesaremos más tarde",
    });
  }

  await updateFeedbackStatus(record.id, "sent", n8nResult.data.body);

  return Ok({
    feedbackId: record.id,
    status: "sent",
    message: "Gracias por tu feedback",
  });
};

export const listFeedbackByTenant = async (
  query: ListFeedbackQuery,
): Promise<Result<{ items: Feedback[]; total: number }, DomainError>> => {
  if (!query.tenantId) {
    return Err(ErrorFactories.validation("tenantId is required", "tenantId"));
  }

  const whereConditions = [eq(feedback.tenantId, query.tenantId)];

  if (query.category) {
    whereConditions.push(eq(feedback.category, query.category));
  }

  if (query.status) {
    whereConditions.push(eq(feedback.status, query.status));
  }

  const offset = (query.page - 1) * query.limit;

  const itemsResult = await fromPromise(
    db
      .select()
      .from(feedback)
      .where(and(...whereConditions))
      .orderBy(desc(feedback.createdAt))
      .limit(query.limit)
      .offset(offset),
    (error) =>
      ErrorFactories.database(
        "list_feedback",
        "Failed to list feedback",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!itemsResult.success) {
    return itemsResult;
  }

  const countResult = await fromPromise(
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(feedback)
      .where(and(...whereConditions)),
    (error) =>
      ErrorFactories.database(
        "count_feedback",
        "Failed to count feedback",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!countResult.success) {
    return countResult as Result<never, DomainError>;
  }

  return Ok({
    items: itemsResult.data,
    total: countResult.data[0]?.count ?? 0,
  });
};
