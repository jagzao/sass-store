import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { db } from "@sass-store/database";
import {
  socialPosts,
  socialPostTargets,
  tenants,
} from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

// Platform character limits
const PLATFORM_LIMITS = {
  facebook: 63206,
  instagram: 2200,
  linkedin: 3000,
  x: 280,
  tiktok: 2200,
  gbp: 1500,
  threads: 500,
};

// Platform-specific guidance
const PLATFORM_GUIDANCE = {
  facebook:
    "Use emojis moderately, ask questions to encourage engagement, include call-to-action",
  instagram:
    "Use 3-5 relevant hashtags, include emojis, keep it visual and inspirational",
  linkedin:
    "Professional tone, focus on expertise and value, use industry terminology",
  x: "Be concise, use 1-2 hashtags max, create urgency or curiosity",
  tiktok: "Casual and fun tone, trendy language, encourage interaction",
  gbp: "Include location info, highlight services/products, professional but friendly",
  threads: "Conversational, authentic, engage with trending topics",
};

/**
 * POST /api/v1/social/generate
 * Generate social media content using AI
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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenant: tenantSlug,
      objective = "brand",
      vibe = "professional",
      platforms = [],
      startDate,
      endDate,
      frequency = { postsPerWeek: 3, reelsPerWeek: 1, storiesPerWeek: 2 },
      contentMix = { promotions: 40, before_after: 30, trends: 20, tips: 10 },
      businessContext = "",
    } = body;

    // Validar datos de entrada
    if (!tenantSlug || !platforms || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: tenant, platforms, startDate, endDate",
        },
        { status: 400 },
      );
    }

    // Verificar que AI está configurado
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "AI service not configured. Please add ANTHROPIC_API_KEY to environment variables.",
        },
        { status: 503 },
      );
    }

    // Get tenant info
    const [tenant] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        description: tenants.description,
      })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 404 },
      );
    }

    // Calculate post count
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weeks = daysDiff / 7;

    const totalPosts = Math.floor(weeks * (frequency.postsPerWeek || 3));
    const totalReels = Math.floor(weeks * (frequency.reelsPerWeek || 1));
    const totalStories = Math.floor(weeks * (frequency.storiesPerWeek || 2));
    const totalContent = totalPosts + totalReels + totalStories;

    // Build AI prompt
    const businessInfo =
      businessContext ||
      `${tenant.name}: ${tenant.description || "A business focused on providing quality services"}`;

    const systemPrompt = `You are an expert social media content strategist and copywriter. Your task is to create engaging, authentic social media content that drives results.

Business Context:
${businessInfo}

Content Objective: ${objective}
Tone/Vibe: ${vibe}
Target Platforms: ${platforms.join(", ")}

Content Mix Distribution:
- Promotional content: ${contentMix.promotions}%
- Before/After showcases: ${contentMix.before_after}%
- Trending topics: ${contentMix.trends}%
- Tips & Education: ${contentMix.tips}%

Generate ${totalContent} pieces of content distributed as:
- ${totalPosts} regular posts
- ${totalReels} reels/video content
- ${totalStories} stories (ephemeral content)

For each piece of content, provide:
1. A catchy title (max 60 chars)
2. The main content text
3. Which platforms it's best suited for
4. The content type (post/reel/story)
5. Suggested posting time (morning/afternoon/evening)

Important Guidelines:
- Keep content authentic and relatable
- Use emojis strategically (not excessively)
- Include clear calls-to-action when appropriate
- Respect platform character limits
- Vary content types to avoid repetition
- Make it engaging and shareable

Return the content as a JSON array with this structure:
[
  {
    "title": "...",
    "content": "...",
    "platforms": ["platform1", "platform2"],
    "format": "post|reel|story",
    "suggestedTime": "morning|afternoon|evening",
    "contentType": "promotional|before_after|trending|tip"
  }
]`;

    // Generate content with AI
    const { text } = await generateText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      prompt: systemPrompt,
      maxTokens: 4000,
      temperature: 0.8,
    });

    // Parse AI response
    let generatedContent: any[] = [];
    try {
      // Extract JSON from AI response (it might be wrapped in markdown code blocks)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse AI-generated content. Please try again.",
        },
        { status: 500 },
      );
    }

    // Validate and format generated content
    const formattedPosts = generatedContent.map((item, index) => {
      // Distribute posts evenly across the date range
      const dayOffset = Math.floor((index / totalContent) * daysDiff);
      const postDate = new Date(start);
      postDate.setDate(postDate.getDate() + dayOffset);

      // Adjust time based on suggested time
      const timeAdjustments = {
        morning: 9,
        afternoon: 14,
        evening: 19,
      };
      postDate.setHours(
        timeAdjustments[item.suggestedTime as keyof typeof timeAdjustments] ||
          12,
      );

      // Ensure platforms are valid
      const validPlatforms = (item.platforms || []).filter((p: string) =>
        platforms.includes(p),
      );

      // If no valid platforms, use all provided platforms
      const finalPlatforms =
        validPlatforms.length > 0 ? validPlatforms : platforms;

      return {
        id: `ai-generated-${index}`,
        title: item.title || `Generated Post ${index + 1}`,
        content: item.content,
        platforms: finalPlatforms,
        format: item.format || "post",
        scheduledAt: postDate.toISOString(),
        status: "draft",
        contentType: item.contentType || "promotional",
      };
    });

    // Sort by scheduled date
    formattedPosts.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

    return NextResponse.json({
      success: true,
      data: {
        generatedPosts: formattedPosts,
        summary: {
          totalPosts: formattedPosts.length,
          postsByFormat: {
            post: formattedPosts.filter((p) => p.format === "post").length,
            reel: formattedPosts.filter((p) => p.format === "reel").length,
            story: formattedPosts.filter((p) => p.format === "story").length,
          },
          postsByType: {
            promotional: formattedPosts.filter(
              (p) => p.contentType === "promotional",
            ).length,
            before_after: formattedPosts.filter(
              (p) => p.contentType === "before_after",
            ).length,
            trending: formattedPosts.filter((p) => p.contentType === "trending")
              .length,
            tip: formattedPosts.filter((p) => p.contentType === "tip").length,
          },
          dateRange: {
            start: startDate,
            end: endDate,
          },
        },
        aiModel: "claude-3-5-sonnet-20241022",
      },
    });
  } catch (error) {
    console.error("Error generating content with AI:", error);

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid AI API key. Please check your ANTHROPIC_API_KEY environment variable.",
          },
          { status: 401 },
        );
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          {
            success: false,
            error: "AI rate limit exceeded. Please try again in a few moments.",
          },
          { status: 429 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate content with AI",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
