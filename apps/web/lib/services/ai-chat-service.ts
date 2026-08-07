import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import type { AiChatMessageInput } from "@sass-store/validation/src/ai-chat";

const N8N_AI_CHAT_WEBHOOK_URL = process.env.N8N_AI_CHAT_WEBHOOK_URL;

export interface AiChatReply {
  reply: string;
  sessionId?: string;
}

export const sendAiChatMessage = async (
  input: AiChatMessageInput,
): Promise<Result<AiChatReply, DomainError>> => {
  if (!N8N_AI_CHAT_WEBHOOK_URL) {
    return Err(
      ErrorFactories.configuration(
        "N8N_AI_CHAT_WEBHOOK_URL",
        "Webhook URL not configured",
        "string",
      ),
    );
  }

  const fetchResult = await fromPromise(
    fetch(N8N_AI_CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(15000),
    }),
    (error) =>
      ErrorFactories.network(
        "Failed to reach AI chat webhook",
        N8N_AI_CHAT_WEBHOOK_URL,
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!fetchResult.success) {
    return fetchResult;
  }

  const response = fetchResult.data;
  const bodyResult = await fromPromise(response.json(), (error) =>
    ErrorFactories.network(
      "Failed to parse AI chat response",
      N8N_AI_CHAT_WEBHOOK_URL,
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
        "AI chat webhook returned an error",
        N8N_AI_CHAT_WEBHOOK_URL,
        response.status,
      ),
    );
  }

  const body = bodyResult.data as { reply?: string; sessionId?: string };
  if (!body.reply) {
    return Err(
      ErrorFactories.network(
        "AI chat webhook returned no reply",
        N8N_AI_CHAT_WEBHOOK_URL,
        response.status,
      ),
    );
  }

  return Ok({ reply: body.reply, sessionId: body.sessionId });
};
