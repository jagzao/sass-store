import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { Result, Ok } from "@sass-store/core/src/result";
import { getClientIp, byIp } from "@/lib/middleware/rate-limit";
import { issueKey as issueIdempotencyKey } from "@/lib/booking/idempotency";

/**
 * GET /api/tenants/[tenant]/book/idempotency-key
 *
 * STRY-021 — Returns a fresh server-issued idempotency key for the mobile
 * booking flow. The key is bound to (ip, tenantSlug) for 5 minutes and must
 * be sent back on POST /bookings as the `X-Idempotency-Key` header.
 *
 * Rate limited by IP (SC-14).
 */
export const GET = withResultHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ tenant: string }> },
  ): Promise<Result<unknown, any>> => {
    const { tenant: tenantSlug } = await context.params;

    const rateLimit = await byIp(request);
    if (!rateLimit.success) return rateLimit;

    const ip = getClientIp(request);
    const issued = await issueIdempotencyKey(ip, tenantSlug);
    if (!issued.success) return issued;

    return Ok(issued.data);
  },
);
