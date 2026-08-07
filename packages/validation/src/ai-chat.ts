import { z } from "zod";

export const AiChatHistoryMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(1000),
});

export const AiChatMessageSchema = z.object({
  tenantSlug: z.string().min(1).max(100),
  message: z.string().min(1).max(1000),
  history: z.array(AiChatHistoryMessageSchema).max(20).optional(),
  sessionId: z.string().max(200).optional(),
});

export type AiChatMessageInput = z.infer<typeof AiChatMessageSchema>;
export type AiChatHistoryMessage = z.infer<typeof AiChatHistoryMessageSchema>;
