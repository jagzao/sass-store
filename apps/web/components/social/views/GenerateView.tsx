"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Music2,
  Building2,
  MessageCircle,
  Tag,
  Repeat2,
  TrendingUp,
  Lightbulb,
  Sparkles,
  X,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

const PLATFORM_CONFIG = {
  facebook: {
    Icon: Facebook,
    name: "Facebook",
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  instagram: {
    Icon: Instagram,
    name: "Instagram",
    color: "bg-pink-50 text-pink-600 border-pink-200",
  },
  linkedin: {
    Icon: Linkedin,
    name: "LinkedIn",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  x: {
    Icon: Twitter,
    name: "X",
    color: "bg-gray-50 text-gray-700 border-gray-200",
  },
  tiktok: {
    Icon: Music2,
    name: "TikTok",
    color: "bg-gray-50 text-gray-900 border-gray-200",
  },
  gbp: {
    Icon: Building2,
    name: "Google Business",
    color: "bg-green-50 text-green-600 border-green-200",
  },
  threads: {
    Icon: MessageCircle,
    name: "Threads",
    color: "bg-gray-50 text-gray-900 border-gray-200",
  },
};

const CONTENT_TYPES = [
  { id: "promotions", label: "Promociones", Icon: Tag },
  { id: "before_after", label: "Antes/Después", Icon: Repeat2 },
  { id: "trends", label: "Tendencias", Icon: TrendingUp },
  { id: "tips", label: "Tips", Icon: Lightbulb },
];

const OBJECTIVES = [
  {
    id: "sales",
    label: "Ventas",
    description: "Aumentar conversiones y promocionar productos",
  },
  {
    id: "brand",
    label: "Marca",
    description: "Fortalecer imagen y reconocimiento de marca",
  },
  {
    id: "educational",
    label: "Educativo",
    description: "Compartir conocimiento y tutoriales",
  },
];

interface GenerateConfig {
  objective: string;
  vibe: string;
  platforms: string[];
  dateRange: {
    start: string;
    end: string;
  };
  frequency: {
    postsPerWeek: number;
    reelsPerWeek: number;
    storiesPerWeek: number;
  };
  contentMix: {
    promotions: number;
    before_after: number;
    trends: number;
    tips: number;
  };
  businessContext: string;
}

interface GeneratedPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  suggestedDate: Date;
  contentType: string;
  status: "draft";
}

interface GenerateViewProps {
  tenant: string;
}

const VIBES = [
  { id: "professional", label: "Profesional" },
  { id: "casual", label: "Casual" },
  { id: "funny", label: "Divertido" },
  { id: "inspiring", label: "Inspirador" },
];

export default function GenerateView({ tenant }: GenerateViewProps) {
  const [config, setConfig] = useState<GenerateConfig>({
    objective: "brand",
    vibe: "professional",
    platforms: ["facebook", "instagram"],
    dateRange: {
      start: format(new Date(), "yyyy-MM-dd"),
      end: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    },
    frequency: {
      postsPerWeek: 3,
      reelsPerWeek: 1,
      storiesPerWeek: 2,
    },
    contentMix: {
      promotions: 40,
      before_after: 30,
      trends: 20,
      tips: 10,
    },
    businessContext: "",
  });

  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePlatformToggle = (platformId: string) => {
    setConfig((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((id) => id !== platformId)
        : [...prev.platforms, platformId],
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/v1/social/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant,
          objective: config.objective,
          vibe: config.vibe,
          platforms: config.platforms,
          startDate: config.dateRange.start,
          endDate: config.dateRange.end,
          frequency: config.frequency,
          contentMix: config.contentMix,
          businessContext: config.businessContext,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message ||
            result.error ||
            "Servicio de generación no disponible. Intenta más tarde.",
        );
      }

      const posts: GeneratedPost[] = result.data.generatedPosts.map(
        (post: any) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          platforms: post.platforms,
          suggestedDate: new Date(post.scheduledAt),
          contentType: post.contentType || "promotional",
          status: post.status,
        }),
      );

      setGeneratedPosts(posts);
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating content:", error);
      const message =
        error instanceof Error ? error.message : "Error al generar contenido";
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToCalendar = async () => {
    try {
      // Save all generated posts to the database
      const savePromises = generatedPosts.map(async (post) => {
        const response = await fetch("/api/v1/social/queue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenant,
            title: post.title,
            baseText: post.content,
            status: "draft",
            scheduledAtUtc: post.suggestedDate,
            platforms: post.platforms.map((platform: string) => ({
              platform,
              variantText: post.content,
              status: "draft",
            })),
            metadata: {
              contentType: post.contentType,
              generatedWithAI: true,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save post: ${post.title}`);
        }

        return response.json();
      });

      await Promise.all(savePromises);

      alert(
        `✅ ${generatedPosts.length} posts saved successfully to your calendar!`,
      );
      setShowPreview(false);
      setGeneratedPosts([]);
    } catch (error) {
      console.error("Error saving posts:", error);
      alert("Error al guardar algunos posts. Por favor, intenta de nuevo.");
    }
  };

  const totalPercentage = Object.values(config.contentMix).reduce(
    (sum, val) => sum + val,
    0,
  );
  const isValidMix = totalPercentage === 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Generar Contenido con IA
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Crea mucho contenido en poco tiempo para tus redes sociales
            </p>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Configuration Form */}
        <div className="space-y-6">
          {/* Objective */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Objetivo
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {OBJECTIVES.map((objective) => (
                <button
                  key={objective.id}
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, objective: objective.id }))
                  }
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    config.objective === objective.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <h3 className="font-medium text-gray-900">
                    {objective.label}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {objective.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe / Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tono
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {VIBES.map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, vibe: vibe.id }))
                  }
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    config.vibe === vibe.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-sm font-medium">{vibe.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Business Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Contexto del negocio
            </label>
            <textarea
              value={config.businessContext}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  businessContext: e.target.value,
                }))
              }
              placeholder="Describe tu negocio, servicios destacados, promociones actuales..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Plataformas
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(PLATFORM_CONFIG).map(([key, platform]) => (
                <button
                  key={key}
                  onClick={() => handlePlatformToggle(key)}
                  className={`relative p-2 sm:p-3 rounded-lg border-2 transition-all ${
                    config.platforms.includes(key)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <platform.Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    <div className="text-xs sm:text-sm font-medium">
                      {platform.name}
                    </div>
                  </div>
                  {config.platforms.includes(key) && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rango de fechas
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="date"
                  aria-label="Desde"
                  value={config.dateRange.start}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="date"
                  aria-label="Hasta"
                  value={config.dateRange.end}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Frecuencia semanal
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  min="0"
                  max="20"
                  aria-label="Posts por semana"
                  placeholder="Posts"
                  value={config.frequency.postsPerWeek}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      frequency: {
                        ...prev.frequency,
                        postsPerWeek: parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  max="10"
                  aria-label="Reels por semana"
                  placeholder="Reels"
                  value={config.frequency.reelsPerWeek}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      frequency: {
                        ...prev.frequency,
                        reelsPerWeek: parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  max="20"
                  aria-label="Stories por semana"
                  placeholder="Stories"
                  value={config.frequency.storiesPerWeek}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      frequency: {
                        ...prev.frequency,
                        storiesPerWeek: parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Content Mix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Mix de contenido{" "}
              <span className="text-xs text-gray-500">
                (Total: {totalPercentage}%)
              </span>
            </label>
            <div className="space-y-3">
              {CONTENT_TYPES.map((contentType) => (
                <div
                  key={contentType.id}
                  className="flex items-center space-x-4"
                >
                  <div className="flex items-center space-x-2 w-28 sm:w-32">
                    <contentType.Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      {contentType.label}
                    </span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={
                        config.contentMix[
                          contentType.id as keyof typeof config.contentMix
                        ]
                      }
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          contentMix: {
                            ...prev.contentMix,
                            [contentType.id]: parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-medium">
                      {
                        config.contentMix[
                          contentType.id as keyof typeof config.contentMix
                        ]
                      }
                      %
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {!isValidMix && (
              <p className="text-sm text-red-600 mt-2">
                El total debe sumar 100%. Actual: {totalPercentage}%
              </p>
            )}
          </div>

          {/* Generate Button */}
          <div className="pt-4 border-t">
            <button
              onClick={handleGenerate}
              disabled={
                isGenerating || !isValidMix || config.platforms.length === 0
              }
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 h-12 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generando contenido...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  {`Generar ${Math.floor(
                    (config.frequency.postsPerWeek +
                      config.frequency.reelsPerWeek +
                      config.frequency.storiesPerWeek) *
                      4,
                  )} publicaciones`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowPreview(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Vista previa ({generatedPosts.length} publicaciones
                    generadas)
                  </h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-4">
                  {generatedPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {post.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {format(post.suggestedDate, "dd/MM/yyyy")} •{" "}
                            {post.platforms
                              .map(
                                (p) =>
                                  PLATFORM_CONFIG[
                                    p as keyof typeof PLATFORM_CONFIG
                                  ].name,
                              )
                              .join(", ")}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            post.contentType === "promotions"
                              ? "bg-purple-100 text-purple-800"
                              : post.contentType === "before_after"
                                ? "bg-blue-100 text-blue-800"
                                : post.contentType === "trends"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-stone-100 text-stone-800"
                          }`}
                        >
                          {(() => {
                            const ct = CONTENT_TYPES.find(
                              (c) => c.id === post.contentType,
                            );
                            return ct ? (
                              <ct.Icon className="inline h-3 w-3 mr-1" />
                            ) : null;
                          })()}
                          <span className="ml-1">
                            {
                              CONTENT_TYPES.find(
                                (ct) => ct.id === post.contentType,
                              )?.label
                            }
                          </span>
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{post.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveToCalendar}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Guardar en Calendario y Cola
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
