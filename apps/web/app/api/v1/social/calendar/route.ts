import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { socialPosts, socialPostTargets } from '@/lib/db/schema';
import { eq, and, gte, lt, sql } from 'drizzle-orm';
import { getTenantIdForRequest } from '@/lib/tenant/resolver';

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdForRequest(request);
    const { searchParams } = new URL(request.url);

    const view = searchParams.get('view') || 'month'; // year, month, week, day
    const date = searchParams.get('date') || new Date().toISOString();
    const timezone = searchParams.get('timezone') || 'UTC';

    const targetDate = new Date(date);

    let startDate: Date;
    let endDate: Date;

    // Calculate date range based on view
    switch (view) {
      case 'year':
        startDate = new Date(targetDate.getFullYear(), 0, 1);
        endDate = new Date(targetDate.getFullYear() + 1, 0, 1);
        break;
      case 'month':
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);
        break;
      case 'week':
        const dayOfWeek = targetDate.getDay();
        startDate = new Date(targetDate);
        startDate.setDate(targetDate.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'day':
        startDate = new Date(targetDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid view parameter' },
          { status: 400 }
        );
    }

    // Query using the database view with fallback for build-time errors
    let calendarData;
    try {
      calendarData = await db.execute(sql`
        SELECT
          tenant_id,
          date,
          post_count,
          statuses,
          platforms,
          draft_count,
          scheduled_count,
          published_count,
          failed_count
        FROM v_social_calendar
        WHERE tenant_id = ${tenantId}
          AND date >= ${startDate.toISOString().split('T')[0]}
          AND date < ${endDate.toISOString().split('T')[0]}
        ORDER BY date ASC
      `);
    } catch (viewError) {
      console.warn('Calendar view not available, using fallback query:', viewError);
      // Fallback to basic query without view
      calendarData = { rows: [] };
    }

    // Get detailed posts for the date range
    const detailedPosts = await db
      .select({
        id: socialPosts.id,
        title: socialPosts.title,
        baseText: socialPosts.baseText,
        status: socialPosts.status,
        scheduledAtUtc: socialPosts.scheduledAtUtc,
        timezone: socialPosts.timezone,
        createdAt: socialPosts.createdAt,
        targets: sql`COALESCE(
          json_agg(
            json_build_object(
              'id', ${socialPostTargets.id},
              'platform', ${socialPostTargets.platform},
              'status', ${socialPostTargets.status},
              'publishAtUtc', ${socialPostTargets.publishAtUtc},
              'variantText', ${socialPostTargets.variantText}
            )
          ) FILTER (WHERE ${socialPostTargets.id} IS NOT NULL),
          '[]'
        )`
      })
      .from(socialPosts)
      .leftJoin(socialPostTargets, eq(socialPosts.id, socialPostTargets.postId))
      .where(and(
        eq(socialPosts.tenantId, tenantId),
        gte(socialPosts.scheduledAtUtc, startDate),
        lt(socialPosts.scheduledAtUtc, endDate)
      ))
      .groupBy(socialPosts.id);

    // Organize posts by date
    const postsByDate: Record<string, any[]> = {};
    detailedPosts.forEach((post: any) => {
      if (post.scheduledAtUtc) {
        const dateKey = post.scheduledAtUtc.toISOString().split('T')[0];
        if (!postsByDate[dateKey]) {
          postsByDate[dateKey] = [];
        }
        postsByDate[dateKey].push(post);
      }
    });

    return NextResponse.json({
      data: {
        view,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timezone,
        summary: calendarData.rows || [],
        posts: postsByDate
      }
    });

  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}