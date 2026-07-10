import { z } from "zod";
import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { validateWithZod } from "@sass-store/validation/src/zod-result";

const PLATFORM_LIMITS = {
  facebook: 63206,
  instagram: 2200,
  linkedin: 3000,
  x: 280,
  tiktok: 2200,
  gbp: 1500,
  threads: 500,
};

const PLATFORM_GUIDANCE = {
  facebook:
    "Uso moderado de emojis, pregunta para engagement, incluye call-to-action",
  instagram: "3-5 hashtags relevantes, emojis, visual e inspiracional",
  linkedin:
    "Tono profesional, enfoque en expertise y valor, terminología de industria",
  x: "Conciso, 1-2 hashtags máximo, urgencia o curiosidad",
  tiktok: "Tono casual y divertido, lenguaje trendy, fomenta interacción",
  gbp: "Incluye info de ubicación, destaca servicios/productos, amable profesional",
  threads: "Conversacional, auténtico, conecta con temas de tendencia",
};

const ContentMixSchema = z.object({
  promotions: z.number().int().min(0).max(100),
  before_after: z.number().int().min(0).max(100),
  trends: z.number().int().min(0).max(100),
  tips: z.number().int().min(0).max(100),
});

const FrequencySchema = z.object({
  postsPerWeek: z.number().int().min(0).max(20),
  reelsPerWeek: z.number().int().min(0).max(10),
  storiesPerWeek: z.number().int().min(0).max(20),
});

export interface GenerateContentInput {
  tenant: string;
  objective: "sales" | "brand" | "educational" | "engagement";
  vibe?: "professional" | "casual" | "funny" | "inspiring";
  platforms: string[];
  startDate: string;
  endDate: string;
  frequency?: z.infer<typeof FrequencySchema>;
  contentMix?: z.infer<typeof ContentMixSchema>;
  businessContext?: string;
}

export const GenerateContentSchema = z.object({
  tenant: z.string().min(1),
  objective: z.enum(["sales", "brand", "educational", "engagement"]),
  vibe: z
    .enum(["professional", "casual", "funny", "inspiring"])
    .default("professional"),
  platforms: z.array(z.string().min(1)).min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  frequency: FrequencySchema.default({
    postsPerWeek: 3,
    reelsPerWeek: 1,
    storiesPerWeek: 2,
  }),
  contentMix: ContentMixSchema.default({
    promotions: 40,
    before_after: 30,
    trends: 20,
    tips: 10,
  }),
  businessContext: z.string().default(""),
});

type RawGenerateInput = GenerateContentInput;

export interface GeneratedPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  format: "post" | "reel" | "story";
  scheduledAt: string;
  status: "draft";
  contentType: string;
}

export interface GenerateContentOutput {
  generatedPosts: GeneratedPost[];
  summary: {
    totalPosts: number;
    postsByFormat: {
      post: number;
      reel: number;
      story: number;
    };
    postsByType: {
      promotional: number;
      before_after: number;
      trending: number;
      tip: number;
    };
    dateRange: {
      start: string;
      end: string;
    };
  };
}

type ContentMixType = z.infer<typeof ContentMixSchema>;

const validateContentMix = (
  mix: ContentMixType,
): Result<ContentMixType, DomainError> => {
  const total = Object.values(mix).reduce((sum, val) => sum + val, 0);
  if (total !== 100) {
    return Err(
      ErrorFactories.validation(
        `El total debe sumar 100%. Actual: ${total}%`,
        "contentMix",
        mix,
      ),
    );
  }
  return Ok(mix);
};

const validateDateRange = (
  startDate: string,
  endDate: string,
): Result<{ start: Date; end: Date; daysDiff: number }, DomainError> => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return Err(
      ErrorFactories.validation("Rango de fechas inválido", "dateRange", {
        startDate,
        endDate,
      }),
    );
  }

  const daysDiff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysDiff < 1) {
    return Err(
      ErrorFactories.validation(
        "El rango de fechas debe ser de al menos 1 día",
        "dateRange",
        { startDate, endDate },
      ),
    );
  }

  return Ok({ start, end, daysDiff });
};

const normalizeGeneratedPost = (
  item: any,
  index: number,
  totalContent: number,
  daysDiff: number,
  start: Date,
  platforms: string[],
): GeneratedPost => {
  const dayOffset = Math.floor((index / totalContent) * daysDiff);
  const postDate = new Date(start);
  postDate.setDate(postDate.getDate() + dayOffset);

  const timeAdjustments: Record<string, number> = {
    morning: 9,
    afternoon: 14,
    evening: 19,
  };
  postDate.setHours(timeAdjustments[item.suggestedTime as string] ?? 12);

  const validPlatforms = (item.platforms || []).filter((p: string) =>
    platforms.includes(p),
  );
  const finalPlatforms = validPlatforms.length > 0 ? validPlatforms : platforms;

  return {
    id: `ai-generated-${index}`,
    title: (item.title || `Generated Post ${index + 1}`).slice(0, 60),
    content: item.content || "",
    platforms: finalPlatforms,
    format: ["post", "reel", "story"].includes(item.format)
      ? item.format
      : "post",
    scheduledAt: postDate.toISOString(),
    status: "draft",
    contentType: item.contentType || "promotional",
  };
};

const DEFAULT_FREQUENCY: z.infer<typeof FrequencySchema> = {
  postsPerWeek: 3,
  reelsPerWeek: 1,
  storiesPerWeek: 2,
};

const DEFAULT_CONTENT_MIX: z.infer<typeof ContentMixSchema> = {
  promotions: 40,
  before_after: 30,
  trends: 20,
  tips: 10,
};

const applyDefaults = (
  data: RawGenerateInput,
): Required<GenerateContentInput> => ({
  ...data,
  vibe: data.vibe ?? "professional",
  frequency: data.frequency ?? DEFAULT_FREQUENCY,
  contentMix: data.contentMix ?? DEFAULT_CONTENT_MIX,
  businessContext: data.businessContext ?? "",
});

export const validateGenerateInput = (
  input: unknown,
): Result<Required<GenerateContentInput>, DomainError> => {
  const parsed = validateWithZod(GenerateContentSchema, input);
  if (!parsed.success) {
    return parsed;
  }

  const data = applyDefaults(parsed.data);

  const mixResult = validateContentMix(data.contentMix);
  if (!mixResult.success) {
    return mixResult;
  }

  const dateResult = validateDateRange(data.startDate, data.endDate);
  if (!dateResult.success) {
    return dateResult;
  }

  return Ok(data);
};

export const callN8nGenerateWebhook = async (
  input: Required<GenerateContentInput>,
): Promise<Result<GenerateContentOutput, DomainError>> => {
  const webhookUrl =
    process.env.N8N_SOCIAL_GENERATE_WEBHOOK_URL ||
    "http://localhost:5678/webhook/social-generate";

  const fetchResult = await fromPromise(
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        platformLimits: PLATFORM_LIMITS,
        platformGuidance: PLATFORM_GUIDANCE,
      }),
    }),
    (error) =>
      ErrorFactories.network(
        "No se pudo conectar con el servicio de generación de contenido",
        webhookUrl,
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!fetchResult.success) {
    return fetchResult;
  }

  const response = fetchResult.data;

  if (!response.ok) {
    return Err(
      ErrorFactories.network(
        "Servicio de generación no disponible. Intenta más tarde.",
        webhookUrl,
        response.status,
      ),
    );
  }

  const jsonResult = await fromPromise(
    response.json() as Promise<{
      success?: boolean;
      data?: {
        generatedPosts?: any[];
        summary?: GenerateContentOutput["summary"];
      };
      error?: string;
    }>,
    (error) =>
      ErrorFactories.network(
        "Respuesta inválida del servicio de generación",
        webhookUrl,
        response.status,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!jsonResult.success) {
    return jsonResult;
  }

  const payload = jsonResult.data;

  if (payload.success === false || payload.error) {
    return Err(
      ErrorFactories.network(
        payload.error || "Error en el servicio de generación",
        webhookUrl,
        response.status,
      ),
    );
  }

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const daysDiff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const weeks = daysDiff / 7;
  const totalPosts = Math.floor(weeks * (input.frequency.postsPerWeek || 3));
  const totalReels = Math.floor(weeks * (input.frequency.reelsPerWeek || 1));
  const totalStories = Math.floor(
    weeks * (input.frequency.storiesPerWeek || 2),
  );
  const totalContent = totalPosts + totalReels + totalStories;

  const rawPosts = Array.isArray(payload.data?.generatedPosts)
    ? payload.data!.generatedPosts
    : [];

  const generatedPosts: GeneratedPost[] = rawPosts.map((item, index) =>
    normalizeGeneratedPost(
      item,
      index,
      totalContent || rawPosts.length,
      daysDiff,
      start,
      input.platforms,
    ),
  );

  generatedPosts.sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  const summary: GenerateContentOutput["summary"] = {
    totalPosts: generatedPosts.length,
    postsByFormat: {
      post: generatedPosts.filter((p) => p.format === "post").length,
      reel: generatedPosts.filter((p) => p.format === "reel").length,
      story: generatedPosts.filter((p) => p.format === "story").length,
    },
    postsByType: {
      promotional: generatedPosts.filter((p) => p.contentType === "promotional")
        .length,
      before_after: generatedPosts.filter(
        (p) => p.contentType === "before_after",
      ).length,
      trending: generatedPosts.filter((p) => p.contentType === "trending")
        .length,
      tip: generatedPosts.filter((p) => p.contentType === "tip").length,
    },
    dateRange: {
      start: input.startDate,
      end: input.endDate,
    },
  };

  return Ok({ generatedPosts, summary });
};
