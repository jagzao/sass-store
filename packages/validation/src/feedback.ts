import { z } from "zod";
import { resultSchema } from "./zod-result";

export const feedbackCategories = [
  "opinion",
  "sugerencia",
  "problema",
] as const;

export const FeedbackCategorySchema = z.enum(feedbackCategories);

export type FeedbackCategory = z.infer<typeof FeedbackCategorySchema>;

export const CreateFeedbackSchema = z.object({
  category: FeedbackCategorySchema,
  message: z.string().min(10).max(2000),
  email: z.string().email().optional(),
  route: z.string().max(500).optional(),
  context: z.record(z.unknown()).optional(),
});

export const CreateFeedbackResultSchema = resultSchema(CreateFeedbackSchema);

export const ListFeedbackQuerySchema = z.object({
  tenantId: z.string().uuid().optional(),
  category: FeedbackCategorySchema.optional(),
  status: z.enum(["pending", "sent", "failed", "retrying"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ListFeedbackQueryResultSchema = resultSchema(
  ListFeedbackQuerySchema,
);

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>;
export type ListFeedbackQuery = z.infer<typeof ListFeedbackQuerySchema>;
