import { NextRequest } from "next/server";
import { db } from "@sass-store/database";
import {
  socialPosts,
  socialPostTargets,
  tenants,
} from "@sass-store/database/schema";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { validateWithZod } from "@sass-store/validation/src/zod-result";

const GetQueueQuerySchema = z.object({
  tenant: z.string().min(1),
  status: z.string().optional(),
  platform: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  id: z.string().optional(),
});

const DeleteQueueQuerySchema = z.object({
  tenant: z.string().min(1),
  ids: z.string().min(1),
});

const PlatformSchema = z.object({
  platform: z.string().min(1),
  variantText: z.string().optional(),
  publishAtUtc: z.union([z.string(), z.date(), z.null()]).optional(),
  status: z.string().optional(),
  assetIds: z.array(z.string()).optional(),
});

const PostBodySchema = z.object({
  id: z.string().optional(),
  tenant: z.string().min(1),
  title: z.string().optional(),
  baseText: z.string().min(1),
  status: z.string().optional(),
  scheduledAtUtc: z.union([z.string(), z.date(), z.null()]).optional(),
  timezone: z.string().optional(),
  platforms: z.array(PlatformSchema).optional(),
  metadata: z.any().optional(),
  mediaIds: z.array(z.string()).optional(),
  createdBy: z.string().optional(),
});

const parseQueryParams = <T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T,
): Result<z.infer<T>, DomainError> => {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    const trimmed = value.trim();
    if (trimmed) {
      params[key] = trimmed;
    }
  });

  return validateWithZod(schema, params);
};

const parseOptionalDate = (
  value: string | Date | null | undefined,
  field: string,
): Result<Date | null, DomainError> => {
  if (!value) {
    return Ok(null);
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return Err(
      ErrorFactories.validation(`Invalid date for ${field}`, field, value),
    );
  }

  return Ok(date);
};

const normalizeMetadata = (metadata: unknown): Record<string, unknown> => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata as Record<string, unknown>;
};

const getTenantId = async (
  tenantSlug: string,
): Promise<Result<string, DomainError>> => {
  const tenantResult = await fromPromise(
    db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1),
    (error) =>
      ErrorFactories.database(
        "find_tenant",
        `Failed to find tenant ${tenantSlug}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!tenantResult.success) {
    return tenantResult;
  }

  const tenant = tenantResult.data[0];
  if (!tenant) {
    return Err(ErrorFactories.notFound("Tenant", tenantSlug));
  }

  return Ok(tenant.id);
};

const setTenantContext = async (
  tenantId: string,
): Promise<Result<void, DomainError>> => {
  const contextResult = await fromPromise(
    db.execute(sql`SELECT set_tenant_context(${tenantId}::uuid)`),
    (error) =>
      ErrorFactories.database(
        "set_tenant_context",
        "Failed to set tenant context",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!contextResult.success) {
    return contextResult;
  }

  return Ok(undefined);
};

export const GET = withResultHandler(
  async (request: NextRequest): Promise<Result<any[], DomainError>> => {
    const queryResult = parseQueryParams(request, GetQueueQuerySchema);
    if (!queryResult.success) {
      return queryResult;
    }

    const {
      tenant: tenantSlug,
      status,
      platform,
      start_date,
      end_date,
      id,
    } = queryResult.data;

    const startDateResult = parseOptionalDate(start_date, "start_date");
    if (!startDateResult.success) {
      return startDateResult;
    }

    const endDateResult = parseOptionalDate(end_date, "end_date");
    if (!endDateResult.success) {
      return endDateResult;
    }

    const tenantIdResult = await getTenantId(tenantSlug);
    if (!tenantIdResult.success) {
      return tenantIdResult;
    }

    const tenantId = tenantIdResult.data;
    const contextResult = await setTenantContext(tenantId);
    if (!contextResult.success) {
      return contextResult;
    }

    const conditions = [eq(socialPosts.tenantId, tenantId)];

    if (status) {
      conditions.push(eq(socialPosts.status, status));
    }

    if (startDateResult.data) {
      conditions.push(gte(socialPosts.scheduledAtUtc, startDateResult.data));
    }

    if (endDateResult.data) {
      conditions.push(lte(socialPosts.scheduledAtUtc, endDateResult.data));
    }

    if (id) {
      conditions.push(eq(socialPosts.id, id));
    }

    const postsResult = await fromPromise(
      db
        .select({
          id: socialPosts.id,
          title: socialPosts.title,
          content: socialPosts.baseText,
          status: socialPosts.status,
          scheduledAt: socialPosts.scheduledAtUtc,
          timezone: socialPosts.timezone,
          createdBy: socialPosts.createdBy,
          createdAt: socialPosts.createdAt,
          updatedAt: socialPosts.updatedAt,
          metadata: socialPosts.metadata,
        })
        .from(socialPosts)
        .where(and(...conditions))
        .orderBy(desc(socialPosts.scheduledAtUtc)),
      (error) =>
        ErrorFactories.database(
          "fetch_social_posts",
          "Failed to fetch queue posts",
          undefined,
          error instanceof Error ? error : undefined,
        ),
    );

    if (!postsResult.success) {
      return postsResult;
    }

    const postsWithTargets: any[] = [];

    for (const post of postsResult.data) {
      const targetsResult = await fromPromise(
        db
          .select({
            id: socialPostTargets.id,
            platform: socialPostTargets.platform,
            status: socialPostTargets.status,
            variantText: socialPostTargets.variantText,
            publishAtUtc: socialPostTargets.publishAtUtc,
            platformPostId: socialPostTargets.platformPostId,
            error: socialPostTargets.error,
            assetIds: socialPostTargets.assetIds,
            metadata: socialPostTargets.metadata,
          })
          .from(socialPostTargets)
          .where(eq(socialPostTargets.postId, post.id)),
        (error) =>
          ErrorFactories.database(
            "fetch_social_post_targets",
            "Failed to fetch post targets",
            undefined,
            error instanceof Error ? error : undefined,
          ),
      );

      if (!targetsResult.success) {
        return targetsResult;
      }

      const targets = targetsResult.data;
      const filteredTargets = platform
        ? targets.filter((target) => target.platform === platform)
        : targets;

      if (platform && filteredTargets.length === 0) {
        continue;
      }

      const metadataMediaIds = Array.isArray((post.metadata as any)?.mediaIds)
        ? ((post.metadata as any).mediaIds as string[])
        : [];
      const targetAssetIds = filteredTargets.flatMap((target) =>
        Array.isArray(target.assetIds) ? target.assetIds : [],
      );
      const mediaIds = metadataMediaIds.length
        ? metadataMediaIds
        : Array.from(new Set(targetAssetIds));

      postsWithTargets.push({
        ...post,
        mediaIds,
        platforms: filteredTargets.map((target) => target.platform),
        targets: filteredTargets,
      });
    }

    return Ok(postsWithTargets);
  },
);

export const POST = withResultHandler(
  async (request: NextRequest): Promise<Result<any, DomainError>> => {
    const bodyResult = await fromPromise(request.json(), (error) =>
      ErrorFactories.validation(
        "Invalid request body",
        "body",
        undefined,
        error,
      ),
    );

    if (!bodyResult.success) {
      return bodyResult;
    }

    const validationResult = validateWithZod(PostBodySchema, bodyResult.data);
    if (!validationResult.success) {
      return validationResult;
    }

    const {
      id,
      tenant: tenantSlug,
      title,
      baseText,
      status = "draft",
      scheduledAtUtc,
      timezone = "UTC",
      platforms = [],
      metadata,
      mediaIds,
      createdBy = "user",
    } = validationResult.data;

    const scheduledAtResult = parseOptionalDate(
      scheduledAtUtc,
      "scheduledAtUtc",
    );
    if (!scheduledAtResult.success) {
      return scheduledAtResult;
    }

    const tenantIdResult = await getTenantId(tenantSlug);
    if (!tenantIdResult.success) {
      return tenantIdResult;
    }

    const tenantId = tenantIdResult.data;
    const contextResult = await setTenantContext(tenantId);
    if (!contextResult.success) {
      return contextResult;
    }

    const normalizedMetadata = normalizeMetadata(metadata);
    const mergedMetadata = mediaIds?.length
      ? { ...normalizedMetadata, mediaIds }
      : normalizedMetadata;

    const platformValues = platforms.map((platform) => {
      const publishAtResult = parseOptionalDate(
        platform.publishAtUtc,
        "publishAtUtc",
      );

      return publishAtResult.success
        ? {
            postId: id ?? "",
            platform: platform.platform,
            variantText: platform.variantText || baseText,
            publishAtUtc:
              publishAtResult.data ?? scheduledAtResult.data ?? null,
            status: platform.status || status,
            timezone,
            assetIds: platform.assetIds ?? [],
          }
        : publishAtResult;
    });

    for (const value of platformValues) {
      if (!(value as any).success && (value as any).error) {
        return value as Result<any, DomainError>;
      }
    }

    const normalizedPlatforms = platformValues as Array<{
      postId: string;
      platform: string;
      variantText: string;
      publishAtUtc: Date | null;
      status: string;
      timezone: string;
      assetIds: string[];
    }>;

    if (id) {
      const updateResult = await fromPromise(
        db
          .update(socialPosts)
          .set({
            title,
            baseText,
            status,
            scheduledAtUtc: scheduledAtResult.data,
            timezone,
            metadata: mergedMetadata,
            updatedBy: createdBy,
            updatedAt: new Date(),
          })
          .where(
            and(eq(socialPosts.id, id), eq(socialPosts.tenantId, tenantId)),
          )
          .returning(),
        (error) =>
          ErrorFactories.database(
            "update_social_post",
            "Failed to update post",
            undefined,
            error instanceof Error ? error : undefined,
          ),
      );

      if (!updateResult.success) {
        return updateResult;
      }

      const updatedPost = updateResult.data[0];
      if (!updatedPost) {
        return Err(ErrorFactories.notFound("SocialPost", id));
      }

      const deleteTargetsResult = await fromPromise(
        db.delete(socialPostTargets).where(eq(socialPostTargets.postId, id)),
        (error) =>
          ErrorFactories.database(
            "delete_social_post_targets",
            "Failed to reset post targets",
            undefined,
            error instanceof Error ? error : undefined,
          ),
      );

      if (!deleteTargetsResult.success) {
        return deleteTargetsResult;
      }

      if (normalizedPlatforms.length > 0) {
        const insertTargetsResult = await fromPromise(
          db.insert(socialPostTargets).values(
            normalizedPlatforms.map((platform) => ({
              ...platform,
              postId: id,
            })),
          ),
          (error) =>
            ErrorFactories.database(
              "insert_social_post_targets",
              "Failed to create post targets",
              undefined,
              error instanceof Error ? error : undefined,
            ),
        );

        if (!insertTargetsResult.success) {
          return insertTargetsResult;
        }
      }

      return Ok({
        ...updatedPost,
        platforms: normalizedPlatforms.map((platform) => platform.platform),
        mediaIds,
      });
    }

    const createResult = await fromPromise(
      db
        .insert(socialPosts)
        .values({
          tenantId,
          title,
          baseText,
          status,
          scheduledAtUtc: scheduledAtResult.data,
          timezone,
          createdBy,
          updatedBy: createdBy,
          metadata: mergedMetadata,
        })
        .returning(),
      (error) =>
        ErrorFactories.database(
          "create_social_post",
          "Failed to create post",
          undefined,
          error instanceof Error ? error : undefined,
        ),
    );

    if (!createResult.success) {
      return createResult;
    }

    const newPost = createResult.data[0];
    if (newPost && normalizedPlatforms.length > 0) {
      const insertTargetsResult = await fromPromise(
        db.insert(socialPostTargets).values(
          normalizedPlatforms.map((platform) => ({
            ...platform,
            postId: newPost.id,
          })),
        ),
        (error) =>
          ErrorFactories.database(
            "insert_social_post_targets",
            "Failed to create post targets",
            undefined,
            error instanceof Error ? error : undefined,
          ),
      );

      if (!insertTargetsResult.success) {
        return insertTargetsResult;
      }
    }

    return Ok({
      ...newPost,
      platforms: normalizedPlatforms.map((platform) => platform.platform),
      mediaIds,
    });
  },
);

export const DELETE = withResultHandler(
  async (request: NextRequest): Promise<Result<any, DomainError>> => {
    const queryResult = parseQueryParams(request, DeleteQueueQuerySchema);
    if (!queryResult.success) {
      return queryResult;
    }

    const { ids, tenant: tenantSlug } = queryResult.data;
    const postIds = ids
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (postIds.length === 0) {
      return Err(ErrorFactories.validation("No post IDs provided", "ids"));
    }

    const tenantIdResult = await getTenantId(tenantSlug);
    if (!tenantIdResult.success) {
      return tenantIdResult;
    }

    const tenantId = tenantIdResult.data;
    const contextResult = await setTenantContext(tenantId);
    if (!contextResult.success) {
      return contextResult;
    }

    const deleteTargetsResult = await fromPromise(
      db
        .delete(socialPostTargets)
        .where(
          inArray(socialPostTargets.postId, postIds as [string, ...string[]]),
        ),
      (error) =>
        ErrorFactories.database(
          "delete_social_post_targets",
          "Failed to delete post targets",
          undefined,
          error instanceof Error ? error : undefined,
        ),
    );

    if (!deleteTargetsResult.success) {
      return deleteTargetsResult;
    }

    const deletedPostsResult = await fromPromise(
      db
        .delete(socialPosts)
        .where(
          and(
            inArray(socialPosts.id, postIds as [string, ...string[]]),
            eq(socialPosts.tenantId, tenantId),
          ),
        )
        .returning({ id: socialPosts.id }),
      (error) =>
        ErrorFactories.database(
          "delete_social_posts",
          "Failed to delete posts",
          undefined,
          error instanceof Error ? error : undefined,
        ),
    );

    if (!deletedPostsResult.success) {
      return deletedPostsResult;
    }

    return Ok({
      deletedIds: deletedPostsResult.data.map((post) => post.id),
      message: `Deleted ${deletedPostsResult.data.length} post${
        deletedPostsResult.data.length === 1 ? "" : "s"
      }`,
    });
  },
);
