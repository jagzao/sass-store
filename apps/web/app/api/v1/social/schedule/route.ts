import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { socialPosts, socialPostTargets } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";
import { getTenantIdForRequest } from "@/lib/tenant/resolver";

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdForRequest(request);
    const { searchParams } = new URL(request.url);

    const platform = searchParams.get("platform");
    const status = searchParams.get("status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get("sort") || "publish_time"; // 'publish_time' | 'created_at'
    const sortOrder = searchParams.get("order") || "asc"; // 'asc' | 'desc'

    // Use the schedule view we created
    let query = sql`
      SELECT
        tenant_id,
        post_id,
        target_id,
        title,
        base_text,
        platform,
        publish_at_utc,
        timezone,
        target_status,
        post_status,
        variant_text,
        asset_ids,
        created_at,
        updated_at
      FROM v_social_schedule
      WHERE tenant_id = ${tenantId}
    `;

    const conditions = [];
    const params = [tenantId];

    if (platform) {
      conditions.push(`AND platform = $${params.length + 1}`);
      params.push(platform);
    }

    if (status) {
      conditions.push(`AND target_status = $${params.length + 1}`);
      params.push(status);
    }

    if (startDate) {
      conditions.push(`AND publish_at_utc >= $${params.length + 1}`);
      params.push(new Date(startDate).toISOString());
    }

    if (endDate) {
      conditions.push(`AND publish_at_utc <= $${params.length + 1}`);
      params.push(new Date(endDate).toISOString());
    }

    // Add conditions to query
    const conditionsStr = conditions.join(" ");

    // Add sorting
    const orderByColumn =
      sortBy === "created_at" ? "created_at" : "publish_at_utc";
    const orderDirection = sortOrder === "desc" ? "DESC" : "ASC";

    const finalQuery = sql.raw(`
      ${query.queryChunks[0]} ${conditionsStr}
      ORDER BY ${orderByColumn} ${orderDirection}
      LIMIT ${limit} OFFSET ${offset}
    `);

    let schedule;
    try {
      schedule = await db.execute(finalQuery);
    } catch (viewError) {
      console.warn("Schedule view not available, using fallback:", viewError);
      schedule = { rows: [] };
    }

    // Get total count for pagination
    let countQuery = sql`
      SELECT COUNT(*) as total
      FROM v_social_schedule
      WHERE tenant_id = ${tenantId}
    `;

    const countConditionsStr = conditions.join(" ");
    const finalCountQuery = sql.raw(`
      ${countQuery.queryChunks[0]} ${countConditionsStr}
    `);

    let total = 0;
    try {
      const result = await db.execute(finalCountQuery);
      total = result[0]?.total || 0;
    } catch (countError) {
      console.warn("Count query failed, using default:", countError);
      total = 0;
    }
    const totalCount = Number(total);
    const totalPages = Math.ceil(totalCount / limit);

    // Group by post for better organization
    const groupedSchedule: Record<string, any> = {};
    (schedule.rows || []).forEach((item: any) => {
      if (!groupedSchedule[item.post_id]) {
        groupedSchedule[item.post_id] = {
          id: item.post_id,
          title: item.title,
          baseText: item.base_text,
          status: item.post_status,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          targets: [],
        };
      }

      if (item.target_id) {
        groupedSchedule[item.post_id].targets.push({
          id: item.target_id,
          platform: item.platform,
          publishAtUtc: item.publish_at_utc,
          timezone: item.timezone,
          status: item.target_status,
          variantText: item.variant_text,
          assetIds: item.asset_ids,
        });
      }
    });

    const organizedSchedule = Object.values(groupedSchedule);

    return NextResponse.json({
      data: organizedSchedule,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
        filters: {
          platform,
          status,
          startDate,
          endDate,
          sortBy,
          sortOrder,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
