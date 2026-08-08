import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { Err } from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import { AiChatMessageSchema } from "@sass-store/validation/src/ai-chat";
import { sendAiChatMessage } from "@/lib/services/ai-chat-service";
import { AdvancedRateLimiter } from "@/lib/security/rate-limiter";

const aiChatRateLimiter = new AdvancedRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 20,
  identifier: "ai-chat",
});

export const POST = withResultHandler(async (request: NextRequest) => {
  const rateResult = await aiChatRateLimiter.checkLimit(request, "ai-chat");

  if (!rateResult.allowed) {
    return Err(
      ErrorFactories.rateLimit(
        20,
        "5m",
        Math.ceil((rateResult.resetTime - Date.now()) / 1000),
      ),
    );
  }

  const bodyResult = await (async () => {
    try {
      const body = await request.json();
      return validateWithZod(AiChatMessageSchema, body);
    } catch (error) {
      return Err(
        ErrorFactories.validation(
          "Failed to parse request body",
          undefined,
          undefined,
          error,
        ),
      );
    }
  })();

  if (!bodyResult.success) {
    return bodyResult;
  }

  return sendAiChatMessage(bodyResult.data);
});
