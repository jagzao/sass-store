import { NextRequest, NextResponse } from "next/server";
import { Result, match } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import {
  callN8nGenerateWebhook,
  validateGenerateInput,
  GenerateContentOutput,
} from "@/lib/services/social-generate-service";

/**
 * POST /api/v1/social/generate
 * Generate social media content using n8n + Ollama
 *
 * Body:
 * - tenant: string (required)
 * - objective: string (sales | brand | educational | engagement)
 * - vibe: string (professional | casual | funny | inspiring)
 * - platforms: string[] (required)
 * - startDate: string (required)
 * - endDate: string (required)
 * - frequency: { postsPerWeek, reelsPerWeek, storiesPerWeek }
 * - contentMix: { promotions, before_after, trends, tips }
 * - businessContext?: string
 */
export const POST = withResultHandler(
  async (
    request: NextRequest,
  ): Promise<Result<GenerateContentOutput, DomainError>> => {
    const bodyResult = await fromJson(request);
    if (!bodyResult.success) {
      return bodyResult;
    }

    const validated = validateGenerateInput(bodyResult.data);
    if (!validated.success) {
      return validated;
    }

    return callN8nGenerateWebhook(validated.data);
  },
);

const fromJson = async (
  request: NextRequest,
): Promise<Result<unknown, DomainError>> => {
  try {
    return {
      success: true,
      data: await request.json(),
    };
  } catch (error) {
    return {
      success: false,
      error: ErrorFactories.validation(
        "Failed to parse request body as JSON",
        undefined,
        undefined,
        error,
      ),
    };
  }
};

export const runtime = "nodejs";
